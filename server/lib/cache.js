/**
 * Cache con Redis cuando está disponible, o Map en memoria como fallback.
 * Uso: const cache = require('./cache');
 *      await cache.get('key')          → valor o null
 *      await cache.set('key', val, 60) → guarda por 60 segundos
 *      await cache.del('key')
 */

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (e) => console.warn('[cache] Redis error:', e.message));
    redisClient.connect().catch((e) => { console.warn('[cache] Redis no disponible, usando memoria:', e.message); redisClient = null; });
  } catch {
    console.warn('[cache] módulo redis no instalado, usando memoria');
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

module.exports = { get, set, del, delPattern };
