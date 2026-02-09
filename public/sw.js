const CACHE_NAME = 'expenseowl-static-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/table.html',
    '/settings.html',
    '/style.css',
    '/functions.js',
    '/db.js',
    '/chart.min.js',
    '/fa.min.css',
    '/manifest.json',
    '/favicon.ico',
    '/pwa/icon-192.png',
    '/pwa/icon-512.png',
    '/webfonts/fa-solid-900.woff2',
    '/webfonts/fa-regular-400.woff2',
    '/webfonts/fa-brands-400.woff2',
    '/webfonts/fa-v4compatibility.woff2'
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
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback: if requesting a page, return the cached index
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
