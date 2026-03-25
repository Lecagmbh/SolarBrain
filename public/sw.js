// SolarBrain Service Worker — Offline-Support für App + Formulare
const CACHE_NAME = 'solarbrain-v2';
const APP_SHELL = [
  '/',
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
  '/app/favicon.svg',
  '/app/favicon.ico',
  '/app/icon-192.png',
  '/app/icon-512.png',
  '/app/logo-baunity.png',
  '/app/logo-baunity-dark.png',
];

// Install: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Some app shell resources failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API Requests: Network only (Queue handles offline)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets (JS, CSS, fonts, images): Cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          // Only cache successful same-origin or CORS responses
          if (response.ok || response.type === 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback for images
          if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
            return new Response('', { status: 404 });
          }
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // Navigation (HTML pages): Network-first, cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful navigation responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cached) => cached || caches.match('/app/index.html'))
            .then((cached) => cached || caches.match('/app/'))
            .then((cached) => cached || caches.match('/'))
            .then((cached) => cached || new Response(
              '<html><body style="background:#0F172A;color:#EAD068;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif"><div style="text-align:center"><h2>Offline</h2><p>Bitte Internet-Verbindung prüfen</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            ));
        })
    );
    return;
  }
});
