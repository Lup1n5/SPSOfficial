// SPS Service Worker
// Provides offline support, caching, and push notifications for PWA

const CACHE_PREFIX = 'sps-cache';
const CACHE_VERSION = 'v1';
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/global.css',
  '/styles/auth.css',
  '/styles/messaging.css',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Some assets failed to cache:', err);
        // Don't fail the entire install if some assets fail
        return Promise.resolve();
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith(CACHE_PREFIX)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other non-http protocols
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return response;
      }

      // Network request
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses for static assets
          if (event.request.url.includes('/styles/') || 
              event.request.url.includes('/icons/') ||
              event.request.url.includes('.js')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Network request failed, return offline page if available
          console.log('[Service Worker] Offline or network error:', event.request.url);
          
          // Return a cached response if available, otherwise fail silently
          return caches.match(event.request);
        });
    })
  );
});

// Push event for iOS PWA notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');
  
  let notificationData = {
    title: 'New Message',
    body: 'You have a new message in SPS',
    icon: '/icons/192.png',
    badge: '/icons/192.png'
  };
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'New Message',
        body: event.data.text() || 'You have a new message in SPS',
        icon: '/icons/192.png',
        badge: '/icons/192.png'
      };
    }
  }

  const options = {
    body: notificationData.body || 'New message in SPS',
    icon: notificationData.icon || '/icons/192.png',
    badge: notificationData.badge || '/icons/192.png',
    vibrate: [100, 50, 100],
    tag: 'sps-notification',
    requireInteraction: false,
    data: {
      dateOfArrival: Date.now(),
      url: notificationData.url || '/',
      sender: notificationData.sender || 'Unknown',
      messageText: notificationData.messageText || ''
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'SPS',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification dismissed');
});

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
