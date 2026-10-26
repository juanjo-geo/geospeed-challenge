/**
 * GeoSpeed — Service Worker v6
 *
 * Strategy: Network-first for ALL requests (ensures fresh deploys are picked up).
 * Falls back to cache only when offline.
 * Fase 11 (juego sin conexión): al instalarse guarda el PAQUETE BASE completo (/offline-manifest.json, generado por el
 * build: código, datos, mascota, banderas, música; ~6 MB) para abrir y jugar sin señal. Los archivos con hash
 * (/assets/…) que ya estaban en la versión anterior se copian sin volver a descargarlos. Los packs de fotos los guarda
 * la pantalla Descargas en cachés "geospeed-pack-<id>", que sobreviven a las actualizaciones.
 * Handles SPA navigation (falls back to /index.html for HTML requests).
 */

const CACHE_NAME = 'geospeed-v144';

// Critical app shell files to pre-cache for offline support
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

const PACK_PREFIX = 'geospeed-pack-';

// Paquete base para jugar sin conexión (lo que falle no impide instalar: se guardará al usarse)
async function precacheBase(cache) {
  try {
    const res = await fetch('/offline-manifest.json', { cache: 'no-store' });
    if (!res.ok) return;
    const manifest = await res.json();
    await Promise.allSettled((manifest.base || []).map(async (url) => {
      if (url.startsWith('/assets/')) {
        const old = await caches.match(url);
        if (old) return cache.put(url, old);
      }
      return cache.add(new Request(url, { cache: 'reload' }));
    }));
  } catch (_) { /* sin red o sin manifiesto: queda el app shell */ }
}

// Install: pre-cache app shell + paquete base, then skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await precacheBase(cache);
    })
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches so stale code is never served
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      // Las versiones viejas se borran; los packs descargados (fotos) se conservan
      Promise.all(keys.filter((k) => k !== CACHE_NAME && !k.startsWith(PACK_PREFIX)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push: show notification from server or scheduled event
self.addEventListener('push', (event) => {
  let data = { title: '🌍 GeoSpeed', body: '¡Hora de jugar!' };
  try {
    if (event.data) data = event.data.json();
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'geospeed',
      data: data,
    })
  );
});

// Notification click: open the app or focus existing tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(url);
    })
  );
});

// Fetch: NETWORK-FIRST for everything.
// Only fall back to cache when the network is unavailable.
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs (Supabase, analytics, etc.)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // SPA navigation: HTML requests should always try index.html as fallback
  const isNavigate = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(async () => {
        // Network failed — try cache as fallback
        // ignoreVary: lo precargado se guardó sin la cabecera Origin que traen los módulos JS (Vary: Origin)
        const cached = await caches.match(event.request, { ignoreSearch: url.pathname.startsWith('/assets/'), ignoreVary: true });
        if (cached) return cached;

        // SPA fallback: serve cached /index.html for navigation requests
        if (isNavigate) {
          const indexCached = await caches.match('/index.html');
          if (indexCached) return indexCached;
        }

        // Last resort: return a basic offline response
        return new Response('Offline — no cached version available', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});
