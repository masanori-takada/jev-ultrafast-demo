// Same-origin GETs: network-first with cache:'no-cache' (GitHub Pages sends max-age=600) and offline cache fallback. Bump CACHE to invalidate.
const CACHE = 'build 2026-10-03 v4'; // synced from js/version.js by tools/build-bookmarklet.mjs
const FILES = [
  './', 'index.html', 'mamazon.html', 'form.html', 'sites.html', 'start.html', 'bookmarklet.html', 'bookmarklet.js', 'manifest.webmanifest',
  'css/site.css', 'css/panel.css', 'css/pages.css', 'css/start.css',
  'js/main.js', 'js/app.js', 'js/panel.js', 'js/site.js', 'js/data.js', 'js/art.js', 'js/filter.js', 'js/engine.js', 'js/mamazon.js', 'js/sw-register.js', 'js/version.js', 'js/config.js', 'js/bm.js', 'js/start.js',
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
  const fallback = () => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()));
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); }
    return r;
  }).catch(fallback));
});
