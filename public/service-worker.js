const CACHE_NAME = 'merisk-blog-v18';
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/theme.js',
  '/manifest.webmanifest',
  '/favicon.png',
  '/fonts/inter-latin-var.woff2',
  '/fonts/cormorant-garamond-latin-var.woff2',
  '/img/banner-night.webp',
  '/img/portrait.webp',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/archive.html',
  '/tags.html',
  '/posts.html',
  '/search.html',
  '/search.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// 先给缓存、同时在后台更新（stale-while-revalidate）。
// 以前每次导航都强制走网络，回访时也要等一整个往返；现在有缓存就立刻出页面。
function staleWhileRevalidate(request, fallback) {
  return caches.open(CACHE_NAME).then(cache =>
    cache.match(request, { ignoreSearch: true }).then(cached => {
      const fresh = fetch(request)
        .then(response => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || (fallback ? caches.match(fallback) : undefined));
      return cached || fresh;
    })
  );
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request, '/offline.html'));
    return;
  }

  // 静态资源同样缓存优先：CSS/JS 带 ?v= 版本号，图片/字体也不常变
  event.respondWith(staleWhileRevalidate(request));
});
