// 2600만 분의 1 service worker: always try the network first so updates show up
// right away, and fall back to the last copy when offline.
const CACHE = 'nk26m-v1';
const CORE = ['./', './manifest.webmanifest', './icons/icon-192.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const keep = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!keep) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true})
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('./') : null))
      .then(hit => hit || Response.error()))
  );
});
