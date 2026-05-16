/**
 * tenantMiddleware — Express middleware de aislamiento multi-tenant
 *
 * Responsabilidades:
 *   1. Garantiza que req.tenantId esté disponible en todos los controllers.
 *   2. Rechaza peticiones sin restaurante asignado con 403.
 *
 * Cómo funciona la inyección automática en Prisma:
 *   - requireAuth (middleware/auth.js) decodifica el JWT y llama a
 *     runWithContext(restaurante_id), que almacena el ID en AsyncLocalStorage.
 *   - lib/prisma.js lee ese ID en cada operación y lo inyecta en args.where /
 *     args.data automáticamente para todos los modelos con restaurante_id.
 *   - Este middleware NO crea un Prisma client separado — la inyección ya ocurre
 *     en el singleton de lib/prisma.js sin overhead por petición.
 *
 * Uso en routes:
 *   router.use(requireAuth, tenantMiddleware);
 *   // A partir de aquí: req.tenantId disponible y Prisma filtra por tenant.
 *
 * Seguridad por capas:
 *   Capa 1 (JWT)      — requireAuth verifica la firma del token
 *   Capa 2 (Express)  — tenantMiddleware garantiza que hay restaurante asignado
 *   Capa 3 (Prisma)   — lib/prisma.js inyecta restaurante_id en cada query
 *   Capa 4 (Route)    — findFirst({ where: { id, restaurante_id: rid } }) antes
 *                        de cada update/delete (protege operaciones por ID único)
 */
module.exports = function tenantMiddleware(req, res, next) {
  const rid = req.user?.restaurante_id;
  if (!rid) {
    return res.status(403).json({ error: 'Acceso denegado: usuario sin restaurante asignado' });
  }
  req.tenantId = rid;
  next();
};
