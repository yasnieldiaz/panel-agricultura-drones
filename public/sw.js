const CACHE_NAME = 'droneagri-v3';
const STATIC_CACHE = 'droneagri-static-v3';
const DYNAMIC_CACHE = 'droneagri-dynamic-v3';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo-192.png',
  '/apple-touch-icon.png'
];

// Assets that should use cache-first strategy
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
  /^https:\/\/tile\.openstreetmap\.org/,
  /^https:\/\/cdnjs\.cloudflare\.com/
];

// Assets that should use network-first strategy
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\.(?:js|css)$/
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Check if URL matches any pattern
const matchesPattern = (url, patterns) => {
  return patterns.some(pattern => pattern.test(url));
};

// Helper: Cache-first strategy
const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
};

// Helper: Network-first strategy
const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation, return cached index
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    return new Response('Offline', { status: 503 });
  }
};

// Helper: Stale-while-revalidate strategy
const staleWhileRevalidate = async (request) => {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
};

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.startsWith('http')) return;

  // API requests - network first with fallback
  if (url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Map tiles and CDN assets - cache first (they rarely change)
  if (matchesPattern(url, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // JS/CSS files - stale while revalidate
  if (matchesPattern(url, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Navigation requests - network first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Background sync for offline form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  // Placeholder for offline form sync
  console.log('Syncing pending requests...');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DroneAgri', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
