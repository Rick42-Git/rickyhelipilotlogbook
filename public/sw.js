const CACHE_NAME = 'heli-logbook-v4';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Max cached items to prevent cache bloat
const MAX_CACHE_ITEMS = 100;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache auth/oauth routes
  if (url.pathname.startsWith('/~oauth') || url.pathname.startsWith('/auth')) return;

  // Never cache Supabase API calls
  if (url.hostname.includes('supabase')) return;

  // Never cache map tile requests — they're too numerous and large
  if (
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('tile.opentopomap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('openaip.net') ||
    url.hostname.includes('stamen-tiles') ||
    url.hostname.includes('fastly.net')
  ) return;

  // Never cache large GeoJSON files
  if (url.pathname.endsWith('.geojson') || url.pathname.endsWith('.json') && url.hostname.includes('github')) return;

  // For navigation requests — network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // For static assets — cache first, network fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Everything else — just fetch, don't cache aggressively
  // This prevents cache bloat from API calls, tile requests, etc.
});
