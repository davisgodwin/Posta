const CACHE_NAME = 'posta-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/posta-favicon.png' // Matches your manifest icon (use '/posta%20favicon.png' if keeping space in name)
];

// Install Event - Cache Core Static Assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Exclude API Requests and Non-GET Calls
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. Never intercept POST/PUT/DELETE requests or backend API calls
  if (e.request.method !== 'GET' || url.pathname.includes('/api/') || url.origin !== location.origin) {
    return;
  }

  // 2. Network-first strategy with SPA navigation fallback to /index.html
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful static asset responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Try returning cached asset first
        const cachedResponse = await caches.match(e.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's a page navigation request (like /register), fallback to index.html for React Router
        if (e.request.mode === 'navigate') {
          const indexPage = await caches.match('/index.html');
          if (indexPage) return indexPage;
        }

        // Return a basic error response if completely offline and asset isn't cached
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});