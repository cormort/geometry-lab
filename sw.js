const CACHE_NAME = 'geometry-lab-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './main.js',
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
    'https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css',
    'https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    // caches.match() searches every cache, so stale versions must be deleted
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// 自家檔案走 network-first（改版才看得到新內容，離線時退回快取）；
// CDN 函式庫版本固定，走 cache-first 省流量。
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const isOwn = new URL(event.request.url).origin === self.location.origin;

    if (isOwn) {
        event.respondWith(
            fetch(event.request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
                    return res;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((res) => res || fetch(event.request))
        );
    }
});
