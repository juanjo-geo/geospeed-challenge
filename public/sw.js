/**
 * GeoSpeed — Service Worker v5
 *
 * Strategy: Network-first for ALL requests (ensures fresh deploys are picked up).
 * Falls back to cache only when offline.
 * Pre-caches the app shell for instant offline startup.
 * Handles SPA navigation (falls back to /index.html for HTML requests).
 */

const CACHE_NAME = 'geospeed-v39';

// Critical app shell files to pre-cache for offline support
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: pre-cache app shell, then skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches so stale code is never served
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
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
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
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
        const cached = await caches.match(event.request);
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
