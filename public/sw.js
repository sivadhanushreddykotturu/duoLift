// High-performance offline & instant-start service worker for DuoLift PWA
const CACHE_NAME = 'duolift-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/ghost.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Never cache mutations, API calls, Clerk auth tokens, Cloudinary, or version.json
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('clerk') ||
    event.request.url.includes('cloudinary') ||
    event.request.url.includes('version.json')
  ) {
    return;
  }

  // 1. Instant App Shell Loading (Stale-While-Revalidate for navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((cached) => {
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        // Serve cached shell immediately in <20ms if available
        return cached || networkFetch;
      })
    );
    return;
  }

  // 2. Cache-first with background caching for static Next.js assets & icons
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes('/_next/static/') ||
            event.request.url.includes('/icon') ||
            event.request.url.includes('/ghost'))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
