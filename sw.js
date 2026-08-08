/* Rutinitas+ — pekerja layanan.
   Menyimpan kerangka aplikasi supaya tetap terbuka tanpa jaringan.
   Data pengguna TIDAK disentuh: semuanya ada di localStorage dan IndexedDB. */

const VERSI = 'rutinitas-plus-v5.8';
const ISI = [
  './',
  './index.html',
  './manifest.webmanifest',
  './ikon-192.png',
  './ikon-512.png',
  './ikon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSI)
      .then(c => c.addAll(ISI))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== VERSI).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const permintaan = e.request;
  if (permintaan.method !== 'GET') return;

  const url = new URL(permintaan.url);
  if (url.origin !== self.location.origin) return;

  /* Halaman: coba jaringan dulu supaya pembaruan cepat terpakai,
     jatuh ke simpanan bila luring. */
  if (permintaan.mode === 'navigate') {
    e.respondWith(
      fetch(permintaan)
        .then(r => {
          const salinan = r.clone();
          caches.open(VERSI).then(c => c.put('./index.html', salinan)).catch(() => {});
          return r;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  /* Sisanya: simpanan dulu, baru jaringan. */
  e.respondWith(
    caches.match(permintaan).then(r => r || fetch(permintaan).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const salinan = res.clone();
        caches.open(VERSI).then(c => c.put(permintaan, salinan)).catch(() => {});
      }
      return res;
    }).catch(() => r))
  );
});

/* Halaman bisa meminta pembaruan segera */
self.addEventListener('message', e => {
  if (e.data === 'perbarui-sekarang') self.skipWaiting();
});
