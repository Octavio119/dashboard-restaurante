/**
 * migrate-sqlite-to-pg.js
 * Migra datos desde restaurante.db (SQLite) a PostgreSQL (Prisma)
 * Uso: node migrate-sqlite-to-pg.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const prisma = require('./lib/prisma');

const DB_PATH       = process.env.SQLITE_SOURCE || path.join(__dirname, 'restaurante.db');
const VENTAS_DB_PATH = path.join(__dirname, 'ventas.db');

async function migrate() {
  console.log('🚀 Iniciando migración SQLite → PostgreSQL\n');
  const sqlite = new Database(DB_PATH);

  try {
    // ── 1. Restaurantes ───────────────────────────────────────────────────────
    const restaurantes = sqlite.prepare('SELECT * FROM restaurantes').all();
    for (const r of restaurantes) {
      await prisma.restaurante.upsert({
        where:  { id: r.id },
        update: {},
        create: { id: r.id, nombre: r.nombre, slug: r.slug, plan: r.plan || 'free', activo: r.activo === 1 },
      });
    }
    console.log(`✅ Restaurantes: ${restaurantes.length}`);

    // ── 2. Usuarios ───────────────────────────────────────────────────────────
    const usuarios = sqlite.prepare('SELECT * FROM usuarios').all();
    for (const u of usuarios) {
      await prisma.usuario.upsert({
        where:  { id: u.id },
        update: {},
        create: { id: u.id, nombre: u.nombre, email: u.email, password_hash: u.password_hash, rol: u.rol || 'staff', activo: u.activo === 1, restaurante_id: u.restaurante_id || 1 },
      });
    }
    console.log(`✅ Usuarios: ${usuarios.length}`);

    // ── 3. Clientes ───────────────────────────────────────────────────────────
    const clientes = sqlite.prepare('SELECT * FROM clientes').all();
    for (const c of clientes) {
      await prisma.cliente.upsert({
        where:  { id: c.id },
        update: {},
        create: { id: c.id, nombre: c.nombre, email: c.email || '', telefono: c.telefono || '', rut: c.rut || '', tipo_cliente: c.tipo_cliente || 'persona', razon_social: c.razon_social || '', visitas: c.visitas || 0, total_gastado: c.total_gastado || 0, estado: c.estado || 'Nuevo', restaurante_id: c.restaurante_id || 1 },
      });
    }
    console.log(`✅ Clientes: ${clientes.length}`);

    // ── 4. Categorias ─────────────────────────────────────────────────────────
    const categorias = sqlite.prepare('SELECT * FROM categorias').all();
    for (const c of categorias) {
      await prisma.categoria.upsert({
        where:  { id: c.id },
        update: {},
        create: { id: c.id, nombre: c.nombre, restaurante_id: c.restaurante_id || 1 },
      });
    }
    console.log(`✅ Categorías: ${categorias.length}`);

    // ── 5. Productos ──────────────────────────────────────────────────────────
    const productos = sqlite.prepare('SELECT * FROM productos').all();
    for (const p of productos) {
      await prisma.producto.upsert({
        where:  { id: p.id },
        update: {},
        create: { id: p.id, nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock || 0, stock_minimo: p.stock_minimo || 10, unidad: p.unidad || 'unidades', activo: p.activo === 1, restaurante_id: p.restaurante_id || 1 },
      });
    }
    console.log(`✅ Productos: ${productos.length}`);

    // ── 6. Pedidos ────────────────────────────────────────────────────────────
    const pedidos = sqlite.prepare('SELECT * FROM pedidos').all();
    for (const p of pedidos) {
      await prisma.pedido.upsert({
        where:  { id: p.id },
        update: {},
        create: { id: p.id, numero: p.numero, cliente_nombre: p.cliente_nombre, item: p.item, total: p.total, estado: p.estado || 'pendiente', metodo_pago: p.metodo_pago || 'efectivo', mesa: p.mesa || '', personas: p.personas || 0, fecha: p.fecha, restaurante_id: p.restaurante_id || 1, reserva_id: p.reserva_id || null },
      });
    }
    console.log(`✅ Pedidos: ${pedidos.length}`);

    // ── 7. Pedido items ───────────────────────────────────────────────────────
    const pedidoItems = sqlite.prepare('SELECT * FROM pedido_items').all();
    for (const i of pedidoItems) {
      await prisma.pedidoItem.upsert({
        where:  { id: i.id },
        update: {},
        create: { id: i.id, pedido_id: i.pedido_id, producto_id: i.producto_id || null, nombre: i.nombre, cantidad: i.cantidad || 1, precio_unitario: i.precio_unitario || 0, restaurante_id: i.restaurante_id || 1 },
      });
    }
    console.log(`✅ Pedido items: ${pedidoItems.length}`);

    // ── 8. Reservas ───────────────────────────────────────────────────────────
    const reservas = sqlite.prepare('SELECT * FROM reservas').all();
    for (const r of reservas) {
      await prisma.reserva.upsert({
        where:  { id: r.id },
        update: {},
        create: { id: r.id, nombre: r.nombre, email: r.email || '', telefono: r.telefono || '', hora: r.hora, personas: r.personas, mesa: r.mesa || '', estado: r.estado || 'pendiente', fecha: r.fecha, consumo_base: r.consumo_base || 0, cliente_id: r.cliente_id || null, restaurante_id: r.restaurante_id || 1 },
      });
    }
    console.log(`✅ Reservas: ${reservas.length}`);

    // ── 9. Reserva consumos ───────────────────────────────────────────────────
    const consumos = sqlite.prepare('SELECT * FROM reserva_consumos').all();
    for (const c of consumos) {
      await prisma.reservaConsumo.upsert({
        where:  { id: c.id },
        update: {},
        create: { id: c.id, reserva_id: c.reserva_id, producto_id: c.producto_id || null, nombre: c.nombre, cantidad: c.cantidad || 1, precio_unitario: c.precio_unitario || 0, restaurante_id: c.restaurante_id || 1 },
      });
    }
    console.log(`✅ Reserva consumos: ${consumos.length}`);

    // ── 10. Ventas (desde ventas.db — Prisma SQLite separado) ─────────────────
    const ventasSqlite = new Database(VENTAS_DB_PATH);
    const ventas = ventasSqlite.prepare('SELECT * FROM Venta').all();
    for (const v of ventas) {
      await prisma.venta.upsert({
        where:  { id: v.id },
        update: {},
        create: { id: v.id, ticket_id: v.ticket_id, items: v.items, subtotal: v.subtotal, total: v.total, metodo_pago: v.metodo_pago, cajero: v.cajero, fecha: v.fecha, restaurante_id: v.restaurante_id || 1, pedido_id: v.pedido_id || null },
      });
    }
    console.log(`✅ Ventas: ${ventas.length}`);

    // ── 11. Cajas ─────────────────────────────────────────────────────────────
    const cajas = sqlite.prepare('SELECT * FROM cajas').all();
    for (const c of cajas) {
      await prisma.caja.upsert({
        where:  { id: c.id },
        update: {},
        create: { id: c.id, fecha: c.fecha, restaurante_id: c.restaurante_id || 1, monto_inicial: c.monto_inicial || 0, total_ventas: c.total_ventas, total_efectivo: c.total_efectivo, monto_final: c.monto_final, diferencia: c.diferencia, cajero_apertura: c.cajero_apertura || '', cajero_cierre: c.cajero_cierre, estado: c.estado || 'abierta', closed_at: c.closed_at ? new Date(c.closed_at) : null },
      });
    }
    console.log(`✅ Cajas: ${cajas.length}`);

    // ── 12. Config negocio ────────────────────────────────────────────────────
    const configs = sqlite.prepare('SELECT * FROM config_negocio').all();
    for (const c of configs) {
      await prisma.configNegocio.upsert({
        where:  { restaurante_id: c.restaurante_id },
        update: {},
        create: { restaurante_id: c.restaurante_id, nombre: c.nombre || 'Mi Restaurante', rut: c.rut || '', direccion: c.direccion || '', currency: c.currency || '$', currency_code: c.currency_code || 'CLP', open_time: c.open_time || '11:00', close_time: c.close_time || '23:30', tax_rate: c.tax_rate ?? 19, payment_methods: c.payment_methods || '{"cash":true,"card":true,"transfer":true,"qr":false}', timezone: c.timezone || 'America/Santiago', idioma: c.idioma || 'es', formato_fecha: c.formato_fecha || 'DD/MM/YYYY', prefijo_ticket: c.prefijo_ticket || 'TKT', numero_inicial: c.numero_inicial || 1, impuesto_activo: c.impuesto_activo !== 0, logo_url: c.logo_url || '' },
      });
    }
    console.log(`✅ Config negocio: ${configs.length}`);

    // ── 13. Proveedores ───────────────────────────────────────────────────────
    const proveedores = sqlite.prepare('SELECT * FROM proveedores').all();
    for (const p of proveedores) {
      await prisma.proveedor.upsert({
        where:  { id: p.id },
        update: {},
        create: { id: p.id, nombre: p.nombre, contacto: p.contacto, telefono: p.telefono, email: p.email, restaurante_id: p.restaurante_id || 1 },
      });
    }
    console.log(`✅ Proveedores: ${proveedores.length}`);

    // ── 14. Inventario movimientos ────────────────────────────────────────────
    const movs = sqlite.prepare('SELECT * FROM inventario_movimientos').all();
    for (const m of movs) {
      await prisma.inventarioMovimiento.upsert({
        where:  { id: m.id },
        update: {},
        create: { id: m.id, producto_id: m.producto_id, usuario_id: m.usuario_id, tipo: m.tipo, cantidad: m.cantidad, motivo: m.motivo, proveedor_id: m.proveedor_id || null, restaurante_id: m.restaurante_id || 1, stock_anterior: m.stock_anterior ?? null, fecha: m.fecha ? new Date(m.fecha) : new Date() },
      });
    }
    console.log(`✅ Inventario movimientos: ${movs.length}`);

    // ── Ajustar secuencias de IDs en PostgreSQL ───────────────────────────────
    const tablas = [
      ['restaurantes', 'Restaurante'], ['usuarios', 'Usuario'], ['clientes', 'Cliente'],
      ['categorias', 'Categoria'], ['productos', 'Producto'], ['pedidos', 'Pedido'],
      ['pedido_items', 'PedidoItem'], ['reservas', 'Reserva'], ['reserva_consumos', 'ReservaConsumo'],
      ['ventas', 'Venta'], ['cajas', 'Caja'], ['proveedores', 'Proveedor'],
      ['inventario_movimientos', 'InventarioMovimiento'],
    ];
    for (const [tabla, _] of tablas) {
      try {
        const maxRow = sqlite.prepare(`SELECT MAX(id) as max FROM ${tabla}`).get();
        const max = maxRow?.max || 0;
        if (max > 0) {
          await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${tabla.replace(/_/g, '_')}"', 'id'), ${max + 1})`);
        }
      } catch {}
    }
    // Las tablas Prisma usan nombres diferentes en Postgres
    const pgSeqs = [
      ['"Restaurante"', restaurantes], ['"Usuario"', usuarios], ['"Cliente"', clientes],
      ['"Categoria"', categorias], ['"Producto"', productos], ['"Pedido"', pedidos],
      ['"PedidoItem"', pedidoItems], ['"Reserva"', reservas], ['"ReservaConsumo"', consumos],
      ['"Venta"', ventas], ['"Caja"', cajas], ['"Proveedor"', proveedores],
      ['"InventarioMovimiento"', movs],
    ];
    for (const [table, rows] of pgSeqs) {
      if (rows.length === 0) continue;
      const maxId = Math.max(...rows.map(r => r.id));
      try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence(${table}, 'id'), ${maxId + 1})`);
      } catch (e) { /* tabla puede no existir con ese nombre exacto */ }
    }

    console.log('\n🎉 Migración completada exitosamente!');
  } catch (err) {
    console.error('\n❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
