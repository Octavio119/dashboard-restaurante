'use strict';
const { Server }        = require('socket.io');
const { createClient }  = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const logger            = require('./logger');
const prisma            = require('./prisma');
const { resolvePlanAccess } = require('./planLimits');
const socketAuth        = require('../middleware/socketAuth');

let _io = null;

// Mapeo rol → sub-salas que debe unirse además de la sala general del restaurante
const ROL_ROOMS = {
  chef:    ['cocina'],
  staff:   ['meseros'],
  admin:   ['caja', 'cocina', 'meseros'],
  gerente: ['caja', 'cocina', 'meseros'],
  cajero:  ['caja'],
};

// Salas destino para cada evento de negocio
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

  // ── Redis Adapter ─────────────────────────────────────────────────────────────
  // Requerido en modo cluster PM2: sin él los broadcasts solo llegan a los sockets
  // conectados al mismo worker, no a todos los workers del proceso.
  if (process.env.REDIS_URL) {
    try {
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
      logger.error({ err }, 'Error conectando Redis Adapter — modo local (single worker)');
    }
  } else {
    logger.warn('Socket.io sin REDIS_URL — broadcasts no cruzarán workers en modo cluster');
  }

  // ── Middleware de autenticación JWT ───────────────────────────────────────────
  // Corre antes del evento 'connection'. Si falla, el cliente recibe connect_error
  // con message 'AUTH_MISSING' o 'AUTH_INVALID' y la conexión se rechaza.
  _io.use(socketAuth);

  // ── Handler de conexión ───────────────────────────────────────────────────────
  _io.on('connection', async socket => {
    // restaurante_id y rol vienen verificados del JWT (seteados por socketAuth)
    const rid = socket.data.restaurante_id;
    const rol = socket.data.rol;

    if (!rid) {
      logger.warn({ socketId: socket.id }, 'socket sin restaurante_id tras auth — rechazando');
      return socket.disconnect(true);
    }

    // Verificar plan en DB — el JWT puede estar vigente pero el plan pudo haber cambiado
    try {
      const restaurante = await prisma.restaurante.findUnique({
        where:  { id: Number(rid) },
        select: { plan: true, trial_ends_at: true },
      });
      const access = resolvePlanAccess({ ...(restaurante || {}), id: Number(rid) });

      if (access.blocked || !access.limits.websocket) {
        socket.emit('plan_upgrade_required', {
          feature:        'websocket',
          plan_actual:    restaurante?.plan,
          plan_requerido: 'pro',
          upgrade_url:    '/billing',
        });
        return socket.disconnect(true);
      }
    } catch (err) {
      logger.error({ err, rid }, 'socket plan check error');
      return socket.disconnect(true);
    }

    // ── Aislamiento por restaurante ───────────────────────────────────────────
    // Sala general: todos los eventos del restaurante
    socket.join(`rest_${rid}`);

    // Sub-salas por rol: filtra qué eventos recibe cada persona
    const salas = ROL_ROOMS[rol] || ['meseros'];
    for (const sala of salas) socket.join(`rest_${rid}:${sala}`);

    logger.info(
      { socketId: socket.id, rid, rol, rooms: [`rest_${rid}`, ...salas.map(s => `rest_${rid}:${s}`)] },
      'socket conectado'
    );

    socket.on('disconnect', reason => {
      logger.info({ socketId: socket.id, rid, rol, reason }, 'socket desconectado');
    });
  });

  return _io;
}

function getIO() { return _io; }

/**
 * Emite un evento a las salas correctas según EVENT_ROOMS.
 * Si el evento no está en el mapa, emite a la sala general del restaurante.
 * Cada restaurante es un tenant aislado — nunca hay broadcast global.
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
