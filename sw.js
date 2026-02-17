const CACHE_NAME = 'cs-schedule-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './data.json',
  './manifest.json',
  './explora-v11-latin-regular.woff2',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700;800&display=swap'
];

// Installation - cache static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching static assets...');
      // Cache one by one to avoid failing all if one fails
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          cache.add(url).catch(e => console.warn('Cache skip:', url, e.message))
        )
      );
    })
  );
});

// Activation - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch with network-first strategy for data, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;
  
  // For data.json - network first, then cache
  if (url.pathname.includes('data.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the updated data
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request).then(cached => {
            if (cached) {
              return cached;
            }
            // If no cache, return basic offline response
            return new Response(
              JSON.stringify({ 
                periodInfo: {}, 
                sections: {} 
              }), 
              { 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          });
        })
    );
    return;
  }
  
  // For HTML navigation - network first, then cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match('./index.html').then(response => {
            if (response) return response;
            return caches.match(request);
          });
        })
    );
    return;
  }
  
  // For other assets - cache first, then network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Return cached version and update in background
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
          })
          .catch(() => {});
        return cached;
      }
      
      // Not in cache - fetch from network
      return fetch(request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for images
        if (request.url.match(/\.(jpg|jpeg|png|gif|svg|ico)$/)) {
          return new Response('', { status: 200, statusText: 'Offline' });
        }
      });
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

async function syncNotes() {
  // Implement notes sync when online
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  // Process any pending sync operations
  console.log('Background sync completed');
}
