import { io } from 'socket.io-client';

/**
 * Crea una instancia de Socket.io autenticada con JWT y con backoff exponencial.
 *
 * Backoff real:
 *   intento 1: ~1000ms × (1 ± 0.5) → 500ms – 1500ms
 *   intento 2: ~2000ms × (1 ± 0.5) → 1000ms – 3000ms
 *   intento 3: ~4000ms              → 2000ms – 6000ms
 *   intento 4: ~8000ms              → 4000ms – 12000ms
 *   intento 5+: se acerca a 30000ms → 15000ms – 30000ms (techo)
 *
 * Socket.io duplica el delay cada intento hasta reconnectionDelayMax.
 * randomizationFactor añade ±50% de jitter para evitar thundering herd
 * (todos los clientes reconectando al mismo instante tras una caída del servidor).
 *
 * @param {string} token  JWT del access token (localStorage.getItem('token'))
 * @returns {import('socket.io-client').Socket}
 */
export function createSocket(token) {
  return io({
    path: '/socket.io',
    auth: { token },

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,        // primer reintento: 1s
    reconnectionDelayMax: 30000,    // techo: 30s
    randomizationFactor: 0.5,       // jitter ±50%
  });
}
