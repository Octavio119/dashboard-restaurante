/**
 * verifyAdminCode — middleware para acciones críticas (eliminar pedido, reserva, venta)
 * Valida que el campo `admin_code` del body coincida con ADMIN_CODE en .env
 */
const { ADMIN_CODE } = require('../config');

module.exports = function verifyAdminCode(req, res, next) {
  if (!ADMIN_CODE) {
    return res.status(500).json({ error: 'ADMIN_CODE no está configurado en el servidor' });
  }

  const { admin_code } = req.body || {};

  if (!admin_code) {
    return res.status(403).json({ error: 'Se requiere el código de administrador' });
  }

  if (admin_code !== ADMIN_CODE) {
    return res.status(403).json({ error: 'Código de administrador incorrecto' });
  }

  next();
};
