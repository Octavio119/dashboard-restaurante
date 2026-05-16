/**
 * Cache con Redis cuando está disponible, o Map en memoria como fallback.
 * Uso: const cache = require('./cache');
 *      await cache.get('key')          → valor o null
 *      await cache.set('key', val, 60) → guarda por 60 segundos
 *      await cache.del('key')
 *
 * ADVERTENCIA DE CLUSTER: sin REDIS_URL cada worker PM2 tiene su propio Map
 * en memoria — las entradas NO se comparten entre instancias. Esto causa
 * cache misses artificiales y comportamiento inconsistente en producción.
 * Configura REDIS_URL para habilitar el caché compartido.
 */

const logger = require('./logger');

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    const socketOptions = process.env.REDIS_URL.startsWith('rediss://')
      ? { socket: { tls: true, rejectUnauthorized: false } }
      : {};
    redisClient = createClient({ url: process.env.REDIS_URL, ...socketOptions });
    redisClient.on('error', (e) => logger.warn({ err: e }, '[cache] Redis error'));
    redisClient.connect().catch((e) => {
      logger.warn({ err: e }, '[cache] Redis no disponible, usando memoria');
      redisClient = null;
    });
  } catch {
    logger.warn('[cache] módulo redis no instalado, usando memoria');
  }
} else {
  // En modo cluster sin Redis cada worker tiene su propio store — cache no compartido
  const isCluster = require('cluster').isWorker || process.env.NODE_APP_INSTANCE !== undefined;
  if (isCluster) {
    logger.warn('[cache] Modo cluster detectado sin REDIS_URL — el caché en memoria NO se comparte entre workers. Configura REDIS_URL.');
  }
}

// Fallback en memoria
const memStore = new Map();

async function get(key) {
  if (redisClient?.isReady) {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  }
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.exp && Date.now() > entry.exp) { memStore.delete(key); return null; }
  return entry.val;
}

async function set(key, val, ttlSeconds = 60) {
  if (redisClient?.isReady) {
    await redisClient.set(key, JSON.stringify(val), { EX: ttlSeconds });
    return;
  }
  memStore.set(key, { val, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
}

async function del(key) {
  if (redisClient?.isReady) { await redisClient.del(key); return; }
  memStore.delete(key);
}

async function delPattern(prefix) {
  if (redisClient?.isReady) {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length) await redisClient.del(keys);
    return;
  }
  for (const k of memStore.keys()) { if (k.startsWith(prefix)) memStore.delete(k); }
}

function isReady() { return !!redisClient?.isReady; }

module.exports = { get, set, del, delPattern, isReady };
