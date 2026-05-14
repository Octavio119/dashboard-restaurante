// MastexoPOS Service Worker — injectManifest mode
// Workbox injects the asset list at build time in place of self.__WB_MANIFEST.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute }           from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin }   from 'workbox-expiration';
import { BackgroundSyncPlugin, Queue } from 'workbox-background-sync';
import { clientsClaim }       from 'workbox-core';

// Take control immediately when updated
self.skipWaiting();
clientsClaim();

// ── Precache all Vite build assets ───────────────────────────────────────────
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ── App shell — serve index.html for all navigation (SPA) ───────────────────
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'app-shell',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    })
  )
);

// ── API routes — NetworkFirst with 3-second timeout ─────────────────────────
// Non-mutating reads are cached briefly so offline navigation works
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/api/auth/') &&
    !url.pathname.startsWith('/api/billing/') &&
    !url.pathname.startsWith('/api/payments/'),
  new NetworkFirst({
    cacheName: 'api-reads',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 5 * 60, // 5-minute freshness — keeps menus/products available offline
      }),
    ],
  }),
  'GET'
);

// ── Static assets — CacheFirst (content-hashed, immutable) ──────────────────
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── Images — StaleWhileRevalidate ────────────────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// ── Google Fonts — CacheFirst ────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// ── Background Sync — pedidos-queue ─────────────────────────────────────────
// When the browser regains connectivity, Workbox replays any queued POST
// requests that failed while offline. The client-side offlineQueue.js handles
// the same sync through the 'online' event; Background Sync covers the case
// where the tab was closed and reopened later.
const pedidosQueue = new Queue('pedidos-queue', {
  maxRetentionTime: 24 * 60, // retry for up to 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        // Notify all open clients so they can refresh their order list
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(client =>
          client.postMessage({ type: 'SYNC_COMPLETE' })
        );
      } catch {
        await queue.unshiftRequest(entry);
        throw new Error('Replay failed — will retry next sync');
      }
    }
  },
});

// Catch failed POST /api/pedidos and enqueue for retry
self.addEventListener('fetch', (event) => {
  if (
    event.request.method === 'POST' &&
    new URL(event.request.url).pathname === '/api/pedidos' &&
    !event.request.headers.get('X-Skip-Queue') // flag to avoid double-queueing
  ) {
    const bgSyncLogic = async () => {
      try {
        return await fetch(event.request.clone());
      } catch {
        await pedidosQueue.pushRequest({ request: event.request });
        // Return a synthetic 202 so the app knows the request was queued
        return new Response(
          JSON.stringify({ _queued: true, message: 'Pedido en cola para sincronizar' }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      }
    };
    event.respondWith(bgSyncLogic());
  }
});

// ── Push from client: manual sync trigger ────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'TRIGGER_SYNC') {
    self.registration.sync.register('sync-pedidos').catch(() => {
      // Browser doesn't support Background Sync — client handles it directly
    });
  }
});

// ── Background Sync event ────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(pedidosQueue.replayRequests());
  }
});
