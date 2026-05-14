// offlineQueue.js — persists pending orders across page reloads using IndexedDB
import { openDB } from 'idb';

const DB_NAME    = 'mastexopos-offline';
const DB_VERSION = 1;
const STORE      = 'pedidos-pendientes';

let _db = null;

async function getDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'queueId' });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
  return _db;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Persist a pedido that failed to reach the server.
 * @param {{ cliente_nombre, mesa, items }} orderData
 * @returns {string} queueId — a local UUID for the queued entry
 */
export async function saveOrder(orderData) {
  const db = await getDB();
  const queueId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.put(STORE, {
    queueId,
    data: orderData,
    timestamp: Date.now(),
    synced: false,
  });
  return queueId;
}

/**
 * Return all orders still waiting to be synced, sorted oldest-first.
 * @returns {Array<{ queueId, data, timestamp, synced }>}
 */
export async function getPendingOrders() {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all
    .filter(e => !e.synced)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove a successfully synced order from the queue.
 * @param {string} queueId
 */
export async function markSynced(queueId) {
  const db = await getDB();
  await db.delete(STORE, queueId);
}

/**
 * Count pending orders — lightweight, avoids loading full objects.
 * @returns {number}
 */
export async function getPendingCount() {
  const db = await getDB();
  return db.count(STORE);
}

/**
 * Clear ALL pending orders (used after a full successful sync).
 */
export async function clearAll() {
  const db = await getDB();
  await db.clear(STORE);
}
