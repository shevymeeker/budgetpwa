const CACHE_NAME = 'expenseowl-v1';
const STATIC_ASSETS = [
    '/',
    '/table',
    '/settings',
    '/style.css',
    '/functions.js',
    '/chart.min.js',
    '/fa.min.css',
    '/manifest.json',
    '/favicon.ico',
    '/pwa/icon-192.png',
    '/pwa/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls: network only (never cache mutable data)
    if (url.pathname.startsWith('/expense') ||
        url.pathname.startsWith('/recurring') ||
        url.pathname.startsWith('/config') ||
        url.pathname.startsWith('/categories') ||
        url.pathname.startsWith('/currency') ||
        url.pathname.startsWith('/startdate') ||
        url.pathname.startsWith('/export') ||
        url.pathname.startsWith('/import') ||
        url.pathname.startsWith('/version')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Static assets: cache-first, fallback to network
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
