// Cache-first app shell. Bump CACHE to invalidate.
const CACHE = 'jev-demo-v1';
const FILES = [
  './', 'index.html', 'mamazon.html', 'form.html', 'sites.html', 'bookmarklet.html', 'bookmarklet.js', 'manifest.webmanifest',
  'css/site.css', 'css/panel.css', 'css/pages.css',
  'js/main.js', 'js/app.js', 'js/panel.js', 'js/site.js', 'js/data.js', 'js/art.js', 'js/filter.js', 'js/engine.js', 'js/mamazon.js', 'js/sw-register.js',
  'js/adapters/index.js', 'js/adapters/demo.js', 'js/adapters/suumo.js',
  'js/generic/text.js', 'js/generic/intent.js', 'js/generic/scan.js', 'js/generic/match.js', 'js/generic/agent.js', 'js/generic/safety.js', 'js/generic/jev.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable.svg',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
