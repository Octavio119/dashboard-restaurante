const { PrismaClient } = require('@prisma/client');
const { getRestaurantId } = require('./context');

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Extensión de Prisma para Multi-tenencia (RLS).
 * En cada operación de base de datos, verificamos si existe un restaurante_id en el contexto.
 * Si existe, ejecutamos un comando SQL "SET LOCAL" antes de la consulta principal.
 * Esto asegura que las políticas de RLS de PostgreSQL se apliquen correctamente.
 */
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const rid = getRestaurantId();
        if (rid && Number.isFinite(rid)) {
          // SET LOCAL solo dura mientras dure la transacción actual.
          // rid es siempre entero (parseInt en runWithContext), Number.isFinite protege contra NaN.
          const [_, result] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.current_restaurant_id', ${String(rid)}, true)`,
            query(args)
          ]);
          return result;
        }
        return query(args);
      },
    },
  },
});

module.exports = prisma;
