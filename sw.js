// Offline cache. Bump CACHE_VERSION every time you deploy a change so phones pick up the new version.
const CACHE_VERSION = 3;
const CACHE = 'bowling-tracker-v' + CACHE_VERSION;
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/main.js', './js/actions.js', './js/render.js', './js/state.js', './js/util.js', './js/constants.js',
  './js/logic.js', './js/pins.js', './js/sample.js',
  './js/views/shared.js', './js/views/bowl.js', './js/views/stats.js', './js/views/games.js',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok && (sameOrigin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || net;
    })
  );
});
