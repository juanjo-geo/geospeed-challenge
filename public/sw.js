/**
 * GeoSpeed IQ Challenge — Service Worker
 *
 * Strategy: Network-first for ALL requests (ensures fresh deploys are picked up).
 * Falls back to cache only when offline.
 * Pre-caches the app shell for instant offline startup.
 */

const CACHE_NAME = 'geospeed-v4';

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

// Fetch: NETWORK-FIRST for everything.
// Only fall back to cache when the network is unavailable.
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

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
      .catch(() => {
        // Network failed — try cache as fallback
        return caches.match(event.request);
      })
  );
});
