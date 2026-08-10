const CACHE_NAME = 'posta-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Let Network requests go through normally, fallback to cache if offline
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});