var CACHE = 'builder-app-v1';
var FILES = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES.filter(function(f){ return !f.startsWith('https://fonts'); }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // For Google Sheets API calls — always go to network
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(function(){ return new Response(JSON.stringify({status:'offline'}), {headers:{'Content-Type':'application/json'}}); }));
    return;
  }
  // For everything else — cache first, then network
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
