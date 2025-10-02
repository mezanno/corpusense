const CACHE_NAME = 'osd-tiles-v1';
let queueToAdd = [];
let queueToRemove = [];
let isProcessing = false;

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((cached) => {
//       return cached || fetch(event.request);
//     }),
//   );
// });
self.addEventListener('fetch', (event) => {
  // On ne gère que les requêtes GET d’images
  if (event.request.method !== 'GET' || event.request.destination !== 'image') {
    return;
  }

  event.respondWith(
    (async () => {
      const absoluteUrl = new URL(event.request.url).href;
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(absoluteUrl);

      if (cached) {
        console.log('[SW] Found in cache:', absoluteUrl);
        return cached;
      }

      console.log('[SW] Not in cache, fetching from network:', absoluteUrl);
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          // miseen cache ici aussi ? (stratégie "cache as you fetch")
          // await cache.put(absoluteUrl, response.clone());
        }
        console.log('[SW] Network fetch success:', absoluteUrl);
        return response;
      } catch (err) {
        console.error('[SW] Network fetch failed:', absoluteUrl, err);
        throw err;
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  console.log('sw - message ', event.data);
  if (!event.data || !event.data.action || !Array.isArray(event.data.imageUrls)) {
    console.warn('sw - invalid message format ', event.data);
    return;
  }

  const absoluteUrls = event.data.imageUrls.map(toAbsoluteUrl);

  if (event.data.action === 'addToCache') {
    queueToAdd = queueToAdd.concat(absoluteUrls);
  } else if (event.data.action === 'removeFromCache') {
    // supprime de la file d’attente d’ajout
    queueToAdd = queueToAdd.filter((url) => !absoluteUrls.includes(url));
    // ajoute à la file de suppression
    queueToRemove = queueToRemove.concat(absoluteUrls);
  }

  if (!isProcessing) processQueue();
});

async function processQueue() {
  isProcessing = true;
  const cache = await caches.open(CACHE_NAME);

  while (queueToAdd.length > 0 || queueToRemove.length > 0) {
    // 1. Supprimer les URLs
    while (queueToRemove.length > 0) {
      const url = queueToRemove.shift();
      const request = new Request(url, { mode: 'cors' });
      const isDeleted = await cache.delete(request);
      console.log('sw - removing from cache ', url, ': ', isDeleted);
    }

    // 2. Ajouter une seule URL à la fois
    if (queueToAdd.length === 0) break;
    const url = queueToAdd[0];
    try {
      const request = new Request(url, { mode: 'cors' });
      const cached = await cache.match(request);
      if (!cached) {
        console.log('sw - caching ', url);
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
          console.log('sw - cached successfully', url);
          queueToAdd.shift();
        } else {
          console.warn('sw - failed to fetch for caching ', { url, status: response.status });
        }
      } else {
        console.log('sw - already cached, skipping', url);
        queueToAdd.shift();
      }
    } catch (error) {
      console.error('sw - error caching ', { url, error });
      // éviter un loop infini
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  isProcessing = false;
}

function toAbsoluteUrl(url) {
  return new URL(url, self.location.origin).href;
}
