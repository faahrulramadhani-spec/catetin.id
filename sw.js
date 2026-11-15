/* catetin.id — service worker: simpan tampilan aplikasi supaya cepat & bisa dibuka tanpa sinyal */
const VERSI = 'catetin-v15';
const SHELL = ['./', './index.html', './config.js', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI && k !== 'catetin-foto').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return; // server data: selalu online
  const sameOrigin = url.origin === self.location.origin;
  const halaman = req.mode === 'navigate' || /\/(index\.html|config\.js)?$/.test(url.pathname) || url.pathname.endsWith('config.js');
  if (sameOrigin && halaman) {
    // utamakan versi terbaru, pakai simpanan bila offline
    e.respondWith(fetch(req).then(r => { const k = r.clone(); caches.open(VERSI).then(c => c.put(req, k)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // ikon, font, dll: pakai simpanan, perbarui di belakang
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const k = r.clone(); caches.open(VERSI).then(c => c.put(req, k)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
