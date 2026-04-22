/**
 * verifyRole(...roles) — middleware factory
 * Uso: router.delete('/:id', requireAuth, verifyRole('admin'), handler)
 *
 * Roles válidos: admin | staff | chef | gerente
 * El super_admin tiene acceso a todo (multi-tenant root).
 */
module.exports = function verifyRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (req.user.rol === 'super_admin') return next(); // acceso total
    if (!roles.includes(req.user.rol))
      return res.status(403).json({ error: `Acceso denegado. Rol requerido: ${roles.join(' o ')}` });
    next();
  };
};
