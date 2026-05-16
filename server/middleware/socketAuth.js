'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * Middleware de autenticación para Socket.io.
 * Verifica el JWT enviado en socket.handshake.auth.token.
 * Adjunta user, restaurante_id y rol a socket.data para el resto de handlers.
 *
 * El cliente debe enviar:  socket = io({ auth: { token: localStorage.getItem('token') } })
 * En caso de error emite:  Error('AUTH_MISSING') | Error('AUTH_INVALID')
 * El cliente puede detectar estos errores en el evento connect_error y hacer logout.
 */
module.exports = function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('AUTH_MISSING'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user           = decoded;
    socket.data.restaurante_id = decoded.restaurante_id;
    socket.data.rol            = decoded.rol;
    next();
  } catch {
    next(new Error('AUTH_INVALID'));
  }
};
