// Service Worker for Push Notification & PWA Auto-Update
// Versi otomatis berdasarkan timestamp build

// PENTING: Jangan edit apapun di sini untuk update!
// Cukup deploy ulang dan service worker akan otomatis update
// karena Next.js/Vercel menghasilkan hash file yang berbeda setiap build

const CACHE_NAME = 'mumi-app-cache';

// Event: Push Notification Received
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');

  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.log('[Service Worker] Error parsing push data:', e);
    data = {
      title: 'Notifikasi Baru',
      body: event.data ? event.data.text() : 'Ada notifikasi baru untuk Anda',
    };
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-ldii.png',
    badge: data.badge || '/logo-ldii.png',
    image: data.image || null,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    tag: data.tag || 'mumi-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [100, 50, 100, 50, 100],
    actions: data.actions || [],
    silent: false,
  };

  console.log('[Service Worker] Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] Notification shown successfully');
      })
      .catch((err) => {
        console.error('[Service Worker] Error showing notification:', err);
      })
  );
});

// Event: Notification Click
self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (let client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Event: Notification Close
self.addEventListener('notificationclose', function (event) {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// Event: Service Worker Install - LANGSUNG SKIP WAITING
self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing...');
  // PENTING: Langsung aktifkan tanpa menunggu
  self.skipWaiting();
});

// Event: Service Worker Activate - LANGSUNG CLAIM SEMUA CLIENTS
self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    Promise.all([
      // Ambil alih semua tab/window yang terbuka
      clients.claim(),
      // Hapus cache lama
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[Service Worker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    ]).then(() => {
      console.log('[Service Worker] Activated and claimed all clients');
      // Beritahu semua clients untuk reload
      return clients.matchAll({ type: 'window' }).then(windowClients => {
        windowClients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED' });
        });
      });
    })
  );
});

// Event: Push Subscription Change
self.addEventListener('pushsubscriptionchange', function (event) {
  console.log('[Service Worker] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    }).then(function (subscription) {
      console.log('[Service Worker] New subscription:', subscription);
      return fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          username: 'auto-renewed',
          device_info: 'subscription-renewed'
        })
      });
    })
  );
});

// Message handler
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - bypass cache untuk selalu fresh
self.addEventListener('fetch', function (event) {
  // Jangan cache apapun, selalu ambil dari network
  return;
});
