
const CACHE_NAME = 'mei-em-dia-offline-v7';
const BASE = self.registration.scope;
const INDEX_URL = new URL('index.html', BASE).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(INDEX_URL, { cache: 'reload' });

    if (!response.ok) {
      throw new Error('Não foi possível obter index.html.');
    }

    const html = await response.clone().text();
    await cache.put(INDEX_URL, response);

    const assets = [];
    const pattern = new RegExp(
      String.raw`(?:src|href)=["']([^"']+)["']`,
      'g'
    );

    for (const match of html.matchAll(pattern)) {
      const path = match[1];

      if (/^(https?:|data:|#|\/\/)/i.test(path)) continue;

      const url = new URL(path, BASE);

      if (url.origin === self.location.origin) {
        assets.push(url.href);
      }
    }

    const urls = [...new Set([BASE, INDEX_URL, ...assets])];

    const results = await Promise.all(urls.map(async (url) => {
      try {
        const asset = await fetch(url, { cache: 'reload' });

        if (asset.ok) {
          await cache.put(url, asset);
          return true;
        }
      } catch {
        // O relatório abaixo identifica recursos não armazenados.
      }

      console.warn('[MEI em Dia] Não foi possível armazenar:', url);
      return false;
    }));

    console.info(
      `[MEI em Dia] Recursos armazenados: ${results.filter(Boolean).length}/${urls.length}`
    );

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter((key) => key.startsWith('mei-em-dia-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(INDEX_URL, response.clone());
        }

        return response;
      } catch {
        return (
          await caches.match(request) ||
          await caches.match(INDEX_URL) ||
          new Response('O acesso offline ainda não está preparado.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        );
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch {
      return new Response('', {
        status: 504,
        statusText: 'Offline resource unavailable',
      });
    }
  })());
});
