const CACHE_NAME = 'Sushi-v1';
const ASSETS = [
  '/Sushi/',
  '/Sushi/index.html',
  '/Sushi/manifest.json',
  '/Sushi/icons/192.png',
  '/Sushi/icons/512.png'
];

self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Cache asset non caricata:', err);
      });
    })
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;

  const isHtml =
    evt.request.mode === 'navigate' ||
    evt.request.url.endsWith('/Sushi/') ||
    evt.request.url.endsWith('index.html');

  // Per index.html: prova prima la rete (così prende subito le nuove esportazioni),
  // se sei offline usa la versione in cache
  if (isHtml) {
    evt.respondWith(
      fetch(evt.request)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, copy));
          return networkRes;
        })
        .catch(() => caches.match(evt.request) || caches.match('/Sushi/index.html'))
    );
    return;
  }

  // Per icone, Tailwind CDN e Font: usa la cache e salva dinamicamente al primo avvio
  evt.respondWith(
    caches.match(evt.request).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(evt.request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, copy));
        }
        return networkRes;
      });
    })
  );
});