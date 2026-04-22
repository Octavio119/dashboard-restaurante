'use strict';
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

let _io = null;

async function init(httpServer) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  // Configurar adaptador de Redis para escalado horizontal
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      
      await Promise.all([pubClient.connect(), subClient.connect()]);
      _io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.io Redis Adapter conectado');
    } catch (err) {
      console.error('❌ Error conectando Redis Adapter:', err);
    }
  }

  _io.on('connection', socket => {
    const rid = socket.handshake.auth?.restaurante_id;
    if (rid) socket.join(`rest_${rid}`);
  });

  return _io;
}

function getIO() { return _io; }

module.exports = { init, getIO };
