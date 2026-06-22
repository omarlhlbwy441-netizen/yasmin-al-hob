/**
 * 🌸 Yasmin PWA Service Worker
 * Advanced caching, background sync, and push notifications
 */

const CACHE_NAME = 'yasmin-v3-cache-v1';
const STATIC_CACHE = 'yasmin-static-v1';
const DYNAMIC_CACHE = 'yasmin-dynamic-v1';
const IMAGE_CACHE = 'yasmin-images-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/static/css/rtl.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

const API_CACHE_PATTERNS = [
  /^\/api\/projects/,
  /^\/api\/agents/,
  /^\/api\/deployments/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !name.startsWith('yasmin-v3'))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    // Handle background sync for POST/PUT/DELETE
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      event.respondWith(handleBackgroundSync(request));
    }
    return;
  }

  // API requests - Network First with cache fallback
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Images - Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache First
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
    });
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background Sync
async function handleBackgroundSync(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Queue for background sync
    const queue = await getSyncQueue();
    queue.push({
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    });
    await saveSyncQueue(queue);

    // Register for background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('yasmin-sync');
    }

    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'yasmin-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = await getSyncQueue();
  const failed = [];

  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body
      });
    } catch (error) {
      failed.push(item);
    }
  }

  await saveSyncQueue(failed);
}

async function getSyncQueue() {
  const db = await openDB();
  return db.get('syncQueue', 'queue') || [];
}

async function saveSyncQueue(queue) {
  const db = await openDB();
  await db.put('syncQueue', queue, 'queue');
}

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, data } = event.notification;

  if (action === 'open') {
    event.waitUntil(clients.openWindow(data.url || '/'));
  } else if (action === 'dismiss') {
    // Just close
  } else {
    event.waitUntil(clients.openWindow(data.url || '/'));
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'yasmin-update-check') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  // Check for new deployments, agent status, etc.
  const response = await fetch('/api/notifications/unread');
  const data = await response.json();

  if (data.count > 0) {
    self.registration.showNotification('Yasmin', {
      body: `You have ${data.count} new notifications`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png'
    });
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yasmin-pwa', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue');
      }
    };
  });
}
