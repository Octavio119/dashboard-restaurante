const { runWithContext } = require('../lib/context');

/**
 * Middleware que envuelve la petición en un contexto asíncrono
 * basándose en el restaurante_id presente en req.user (inyectado por requireAuth).
 */
module.exports = function contextMiddleware(req, res, next) {
  if (req.user && req.user.restaurante_id) {
    runWithContext(req.user.restaurante_id, () => {
      next();
    });
  } else {
    next();
  }
};
