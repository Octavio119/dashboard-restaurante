const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
const { getRestaurantId } = require('./context');
const logger = require('./logger');

// Los campos @db.Decimal (montos, precios, tax_rate) llegan de Prisma como
// instancias de Decimal, no `number`. Por diseño, decimal.js NO castea
// implícitamente a número (valueOf/toJSON devuelven string) para evitar
// pérdida de precisión silenciosa — pero eso rompe `+` (concatena strings),
// JSON.stringify/res.json (serializa como string) y comparaciones.
// Como ya truncamos a 2 decimales en la BD (Decimal(12,2)), no hay precisión
// extra que perder: parcheamos el prototipo una sola vez para que el resto
// de la app (rutas, sockets, exports) siga tratando estos campos como number,
// igual que antes de migrar de Float a Decimal. toFixed() no se toca: ya
// funciona igual que en Number.
Decimal.prototype.valueOf = function () { return Number(this.toString()); };
Decimal.prototype.toJSON  = function () { return Number(this.toString()); };

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }]
    : [{ emit: 'event', level: 'error' }],
});

// El motor de queries de Prisma (Rust) puede entrar en panic ("timer has gone
// away") cuando la conexión a la BD se cae a medias — el proceso de Node sigue
// vivo pero el query engine queda en un estado inconsistente y todas las
// queries posteriores cuelgan o fallan. No hay forma de recuperar ese estado
// desde JS: la única salida confiable es terminar el proceso y dejar que
// Railway lo reinicie (restart policy ya configurada en railway.json).
basePrisma.$on('error', (e) => {
  logger.error({ err: e }, 'Prisma engine error');
  if (typeof e.message === 'string' && e.message.includes('timer has gone away')) {
    logger.fatal({ err: e }, 'Prisma query engine panic detectado — terminando proceso para que Railway reinicie');
    process.exit(1);
  }
});

// Modelos que contienen restaurante_id como clave de tenant (PascalCase = nombre interno de Prisma)
const TENANT_MODELS = new Set([
  'Usuario', 'Cliente', 'Categoria', 'Producto',
  'Pedido', 'PedidoItem', 'Reserva', 'ReservaConsumo',
  'Venta', 'VentaItem', 'Caja', 'ConfigNegocio',
  'Proveedor', 'InventarioMovimiento', 'ApiKey', 'AuditLog', 'TicketSecuencia',
]);

// Operaciones donde se puede inyectar restaurante_id en args.where sin romper Prisma.
// update/delete quedan excluidos: su where debe ser un campo @unique (ej. id),
// y las rutas ya hacen findFirst ownership-check antes de cada update/delete.
const FILTERABLE_OPS = new Set([
  'findMany', 'findFirst', 'findFirstOrThrow',
  'count', 'aggregate', 'groupBy',
  'updateMany', 'deleteMany',
]);

/**
 * Extensión de Prisma con doble capa de aislamiento multi-tenant:
 *
 * 1. Capa de aplicación — inyecta restaurante_id en args automáticamente:
 *    - Lecturas (findMany, findFirst, count…): filtra por tenant en WHERE
 *    - Bulk writes (updateMany, deleteMany): limita el alcance al tenant
 *    - Creates (create, createMany): fuerza restaurante_id en data, ignorando
 *      cualquier valor que el cliente haya enviado en el body
 *
 * 2. Capa de BD — SET CONFIG para PostgreSQL RLS (cuando las policies estén activas)
 *
 * NOTA: las operaciones dentro de req.prisma.$transaction(async tx => {...}) usan
 * el cliente tx, que no hereda esta extensión. Esas rutas ya incluyen restaurante_id
 * manualmente en cada query de la transacción.
 */
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const rid = getRestaurantId();

        if (rid && Number.isFinite(rid)) {
          if (TENANT_MODELS.has(model)) {
            if (FILTERABLE_OPS.has(operation)) {
              // El tenant del servidor siempre gana sobre cualquier where del cliente
              args.where = { ...args.where, restaurante_id: rid };
            } else if (operation === 'create') {
              // Sobreescribe cualquier restaurante_id que el cliente haya colado en el body
              args.data = { ...args.data, restaurante_id: rid };
            } else if (operation === 'createMany' && Array.isArray(args.data)) {
              args.data = args.data.map(d => ({ ...d, restaurante_id: rid }));
            }
          }

          // Capa BD: SET CONFIG para RLS de PostgreSQL
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.current_restaurant_id', ${String(rid)}, true)`,
            query(args),
          ]);
          return result;
        }

        return query(args);
      },
    },
  },
});

module.exports = prisma;
