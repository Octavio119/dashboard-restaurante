'use strict';
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const logger = require('./logger');
const prisma = require('./prisma');
const { PLAN_LIMITS } = require('./planLimits');

let _io = null;

// Mapeo rol → salas que debe unirse
const ROL_ROOMS = {
  chef:    ['cocina'],
  staff:   ['meseros'],
  admin:   ['caja', 'cocina', 'meseros'],
  gerente: ['caja', 'cocina', 'meseros'],
  cajero:  ['caja'],
};

// Salas que reciben cada evento
const EVENT_ROOMS = {
  'pedido:creado':      ['cocina', 'meseros'],
  'pedido:actualizado': ['cocina', 'caja', 'meseros'],
  'venta:realizada':    ['caja'],
  'stock:alerta':       ['caja', 'meseros'],
};

async function init(httpServer) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  _io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
    // ping/pong para detectar clientes caídos antes de que Redis acumule dead sockets
    pingTimeout:  20000,
    pingInterval: 25000,
  });

  if (process.env.REDIS_URL) {
    try {
      // Upstash requiere rediss:// (TLS). Node redis v5 lo maneja automático
      // si la URL empieza con rediss://.
      const socketOptions = process.env.REDIS_URL.startsWith('rediss://')
        ? { socket: { tls: true, rejectUnauthorized: false } }
        : {};

      const pubClient = createClient({ url: process.env.REDIS_URL, ...socketOptions });
      const subClient = pubClient.duplicate();

      pubClient.on('error', err => logger.error({ err }, 'Redis pub error'));
      subClient.on('error', err => logger.error({ err }, 'Redis sub error'));

      await Promise.all([pubClient.connect(), subClient.connect()]);
      _io.adapter(createAdapter(pubClient, subClient));
      logger.info({ url: process.env.REDIS_URL.split('@').pop() }, 'Socket.io Redis Adapter conectado');
    } catch (err) {
      logger.error({ err }, 'Error conectando Redis Adapter (modo local)');
      // Continúa sin adapter — funciona con un solo servidor
    }
  }

  _io.on('connection', async socket => {
    const rid = socket.handshake.auth?.restaurante_id;
    const rol = socket.handshake.auth?.rol;
    if (!rid) return socket.disconnect(true);

    try {
      const restaurante = await prisma.restaurante.findUnique({
        where:  { id: Number(rid) },
        select: { plan: true },
      });
      const plan   = restaurante?.plan || 'free';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      if (!limits.websocket) {
        socket.emit('plan_upgrade_required', {
          feature:        'websocket',
          plan_actual:    plan,
          plan_requerido: 'pro',
          upgrade_url:    '/billing',
        });
        return socket.disconnect(true);
      }
    } catch (err) {
      logger.error({ err, rid }, 'socket plan check error');
      return socket.disconnect(true);
    }

    // Sala general del restaurante
    socket.join(`rest_${rid}`);

    // Salas por rol
    const salas = ROL_ROOMS[rol] || ['meseros'];
    for (const sala of salas) socket.join(`rest_${rid}:${sala}`);
  });

  return _io;
}

function getIO() { return _io; }

/**
 * Emite un evento a las salas correctas según EVENT_ROOMS.
 * Si el evento no está en el mapa, emite a la sala general del restaurante.
 */
function emit(rid, event, data) {
  if (!_io || !rid) return;
  const salas = EVENT_ROOMS[event];
  if (salas) {
    for (const sala of salas) _io.to(`rest_${rid}:${sala}`).emit(event, data);
  } else {
    _io.to(`rest_${rid}`).emit(event, data);
  }
}

module.exports = { init, getIO, emit };
