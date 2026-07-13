const CACHE = 'tally-v3';

const PRECACHE = [
  './',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js',
];

function putInCache(request, response) {
  if (!response || !response.ok) return Promise.resolve();
  const copy = response.clone();
  return caches.open(CACHE)
    .then(cache => cache.put(request, copy))
    .catch(() => {});
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(PRECACHE.map(url => cache.add(url)))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Let Supabase API calls go straight through — app handles offline queueing
  if (url.includes('supabase.co')) return;

  // Network-first for the app shell (picks up deployments)
  if (url.endsWith('/') || url.includes('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          putInCache(event.request, res);
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (CDN assets, fonts)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Refresh cache in background
        fetch(event.request).then(res => {
          putInCache(event.request, res);
        }).catch(()=>{});
        return cached;
      }
      return fetch(event.request).then(res => {
        putInCache(event.request, res);
        return res;
      });
    })
  );
});

// Background Sync: when network returns (even if app is closed), tell the app to flush its queue
self.addEventListener('sync', event => {
  if (event.tag === 'tally-flush') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
        if (clients.length) clients[0].postMessage({ type: 'FLUSH_QUEUE' });
      })
    );
  }
});
