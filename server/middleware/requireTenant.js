module.exports = function requireTenant(req, res, next) {
  if (!req.user?.restaurante_id) {
    return res.status(403).json({ error: 'Sin acceso: usuario sin restaurante asignado' });
  }
  next();
};
