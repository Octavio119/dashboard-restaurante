const { PrismaClient } = require('../generated/prisma');
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
        if (rid) {
          // Ejecutamos SET LOCAL en la misma transacción que la consulta para que PostgreSQL reconozca la variable.
          // Nota: SET LOCAL solo dura mientras dure la transacción actual.
          const [_, result] = await basePrisma.$transaction([
            basePrisma.$executeRawUnsafe(`SET LOCAL "app.current_restaurant_id" = '${rid}'`),
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
