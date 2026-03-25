// ══════════════════════════════════════════════════════════════
// MindShift — Service Worker (Cache-First Strategy)
// Enables offline functionality for PWA
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'mindshift-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/fasting.css',
  '/css/movement.css',
  '/css/dark-mode.css',
  '/css/animations.css',
  '/css/physio.css',
  '/js/app.js',
  '/js/habits.js',
  '/js/celebrations.js',
  '/js/charts.js',
  '/js/icons.js',
  '/js/ai-coach.js',
  '/js/physio.js',
  '/js/physio-svg.js',
  '/js/physio-coach.js',
  '/js/fasting.js',
  '/js/fasting-svg.js',
  '/js/movement.js',
  '/js/movement-svg.js',
  '/js/config.js',
  '/manifest.json'
];

// Install: cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app assets, network-first for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for API calls (Gemini)
  if (url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Cache-first for app assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/'));
    })
  );
});
