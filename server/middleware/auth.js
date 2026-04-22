const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { runWithContext } = require('../lib/context');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Envolvemos el resto de la cadena de middleware/rutas en el contexto del restaurante
    if (decoded.restaurante_id) {
      runWithContext(decoded.restaurante_id, () => {
        next();
      });
    } else {
      next();
    }
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
