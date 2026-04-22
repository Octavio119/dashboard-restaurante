/**
 * Migración: optimización de BD para escala SaaS
 * - fecha String → DateTime en Pedido, Venta, Reserva, Caja
 * - Crear tabla VentaItem y migrar datos desde Venta.items JSON
 * - Eliminar columna Venta.items
 * - Agregar índices de performance
 *
 * Ejecutar UNA sola vez: node server/scripts/migrate-db-optimization.js
 */

require('dotenv').config();
const { PrismaClient } = require('C:/tmp/prisma-gen');

const prisma = new PrismaClient();

async function run() {
  console.log('🚀 Iniciando migración de optimización...\n');

  // ─── 1. Cambiar fecha String → DateTime ──────────────────────────────────────
  console.log('1. Convirtiendo columnas fecha a DateTime...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Pedido"  ALTER COLUMN fecha TYPE TIMESTAMP(3) USING fecha::timestamp
  `).catch(e => { if (!e.message.includes('already')) throw e; });

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Reserva" ALTER COLUMN fecha TYPE TIMESTAMP(3) USING fecha::timestamp
  `).catch(e => { if (!e.message.includes('already')) throw e; });

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Venta"   ALTER COLUMN fecha TYPE TIMESTAMP(3) USING fecha::timestamp
  `).catch(e => { if (!e.message.includes('already')) throw e; });

  // Caja tiene unique constraint — drop + alter + recreate
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Caja" DROP CONSTRAINT IF EXISTS "Caja_fecha_restaurante_id_key"
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Caja" ALTER COLUMN fecha TYPE TIMESTAMP(3) USING fecha::timestamp
  `).catch(e => { if (!e.message.includes('already')) throw e; });
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Caja_fecha_restaurante_id_key"
    ON "Caja"(fecha, restaurante_id)
  `);

  console.log('   ✅ fecha DateTime ok\n');

  // ─── 2. Crear tabla VentaItem ─────────────────────────────────────────────────
  console.log('2. Creando tabla VentaItem...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VentaItem" (
      id               SERIAL         PRIMARY KEY,
      venta_id         INT            NOT NULL REFERENCES "Venta"(id) ON DELETE CASCADE,
      producto_id      INT,
      nombre           TEXT           NOT NULL DEFAULT '',
      qty              INT            NOT NULL DEFAULT 1,
      precio_unitario  DOUBLE PRECISION NOT NULL DEFAULT 0,
      restaurante_id   INT            NOT NULL DEFAULT 1 REFERENCES "Restaurante"(id),
      created_at       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('   ✅ VentaItem creada\n');

  // ─── 3. Migrar JSON items → VentaItem ─────────────────────────────────────────
  console.log('3. Migrando datos de Venta.items a VentaItem...');
  const result = await prisma.$executeRawUnsafe(`
    INSERT INTO "VentaItem" (venta_id, producto_id, nombre, qty, precio_unitario, restaurante_id)
    SELECT
      v.id,
      NULLIF(NULLIF(item->>'producto_id', ''), 'null')::INT,
      COALESCE(NULLIF(item->>'nombre', ''), 'Item'),
      COALESCE(NULLIF(item->>'qty', '')::INT, 1),
      COALESCE(
        NULLIF(item->>'precio_unitario', '')::DOUBLE PRECISION,
        NULLIF(item->>'precio_unit',     '')::DOUBLE PRECISION,
        0
      ),
      v.restaurante_id
    FROM "Venta" v,
      jsonb_array_elements(
        CASE
          WHEN v.items IS NULL OR v.items = '' OR v.items = 'null' THEN '[]'::jsonb
          ELSE v.items::jsonb
        END
      ) AS item
    WHERE NOT EXISTS (SELECT 1 FROM "VentaItem" vi WHERE vi.venta_id = v.id)
  `);
  console.log(`   ✅ ${result} filas migradas\n`);

  // ─── 4. Eliminar columna items de Venta ──────────────────────────────────────
  console.log('4. Eliminando columna Venta.items...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Venta" DROP COLUMN IF EXISTS items
  `);
  console.log('   ✅ Columna items eliminada\n');

  // ─── 5. Agregar índices de performance ───────────────────────────────────────
  console.log('5. Creando índices...');
  const indexes = [
    // Pedido
    `CREATE INDEX IF NOT EXISTS "Pedido_restaurante_id_idx"        ON "Pedido"(restaurante_id)`,
    `CREATE INDEX IF NOT EXISTS "Pedido_restaurante_id_fecha_idx"  ON "Pedido"(restaurante_id, fecha)`,
    `CREATE INDEX IF NOT EXISTS "Pedido_restaurante_id_estado_idx" ON "Pedido"(restaurante_id, estado)`,
    // Venta
    `CREATE INDEX IF NOT EXISTS "Venta_restaurante_id_idx"         ON "Venta"(restaurante_id)`,
    `CREATE INDEX IF NOT EXISTS "Venta_restaurante_id_fecha_idx"   ON "Venta"(restaurante_id, fecha)`,
    // VentaItem
    `CREATE INDEX IF NOT EXISTS "VentaItem_venta_id_idx"           ON "VentaItem"(venta_id)`,
    `CREATE INDEX IF NOT EXISTS "VentaItem_restaurante_id_idx"     ON "VentaItem"(restaurante_id)`,
    // Reserva
    `CREATE INDEX IF NOT EXISTS "Reserva_restaurante_id_idx"        ON "Reserva"(restaurante_id)`,
    `CREATE INDEX IF NOT EXISTS "Reserva_restaurante_id_fecha_idx"  ON "Reserva"(restaurante_id, fecha)`,
    `CREATE INDEX IF NOT EXISTS "Reserva_restaurante_id_estado_idx" ON "Reserva"(restaurante_id, estado)`,
    // Caja
    `CREATE INDEX IF NOT EXISTS "Caja_restaurante_id_idx"           ON "Caja"(restaurante_id)`,
    // PedidoItem
    `CREATE INDEX IF NOT EXISTS "PedidoItem_pedido_id_idx"          ON "PedidoItem"(pedido_id)`,
    `CREATE INDEX IF NOT EXISTS "PedidoItem_restaurante_id_idx"     ON "PedidoItem"(restaurante_id)`,
    // ReservaConsumo
    `CREATE INDEX IF NOT EXISTS "ReservaConsumo_reserva_id_idx"     ON "ReservaConsumo"(reserva_id)`,
    `CREATE INDEX IF NOT EXISTS "ReservaConsumo_restaurante_id_idx" ON "ReservaConsumo"(restaurante_id)`,
    // Cliente
    `CREATE INDEX IF NOT EXISTS "Cliente_restaurante_id_idx"        ON "Cliente"(restaurante_id)`,
    // Producto
    `CREATE INDEX IF NOT EXISTS "Producto_restaurante_id_idx"       ON "Producto"(restaurante_id)`,
    // InventarioMovimiento
    `CREATE INDEX IF NOT EXISTS "InventarioMovimiento_restaurante_id_idx" ON "InventarioMovimiento"(restaurante_id)`,
    `CREATE INDEX IF NOT EXISTS "InventarioMovimiento_producto_id_idx"    ON "InventarioMovimiento"(producto_id)`,
    // Proveedor
    `CREATE INDEX IF NOT EXISTS "Proveedor_restaurante_id_idx"      ON "Proveedor"(restaurante_id)`,
    // Usuario
    `CREATE INDEX IF NOT EXISTS "Usuario_restaurante_id_idx"        ON "Usuario"(restaurante_id)`,
  ];

  for (const sql of indexes) {
    await prisma.$executeRawUnsafe(sql);
    process.stdout.write('.');
  }
  console.log(`\n   ✅ ${indexes.length} índices creados\n`);

  console.log('🎉 Migración completada exitosamente.');
}

run()
  .catch(e => { console.error('❌ Error en migración:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
