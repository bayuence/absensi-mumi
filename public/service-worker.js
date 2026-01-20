// Service Worker for Push Notification
// Versi: 2.0 - Dengan dukungan lengkap untuk mobile

const CACHE_VERSION = 'v2';

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
    // Fallback jika data bukan JSON
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
    tag: data.tag || 'default-tag', // Mencegah duplikasi notifikasi
    renotify: true, // Tetap bunyi meski tag sama
    requireInteraction: false, // Auto dismiss di mobile
    vibrate: [100, 50, 100, 50, 100], // Pola getaran untuk mobile
    actions: data.actions || [],
    // Untuk Android/Mobile
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
        // Cek apakah sudah ada tab yang terbuka
        for (let client of windowClients) {
          // Jika sudah ada tab dengan URL yang sama, focus ke tab itu
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Jika tidak ada tab yang terbuka, buka tab baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Event: Notification Close (untuk analytics jika diperlukan)
self.addEventListener('notificationclose', function (event) {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// Event: Service Worker Install
self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker...', CACHE_VERSION);
  // Skip waiting agar langsung aktif
  self.skipWaiting();
});

// Event: Service Worker Activate
self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker...', CACHE_VERSION);
  // Claim semua clients agar langsung bisa handle push
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[Service Worker] Claimed all clients');
    })
  );
});

// Event: Push Subscription Change (untuk handle renewal)
self.addEventListener('pushsubscriptionchange', function (event) {
  console.log('[Service Worker] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    }).then(function (subscription) {
      console.log('[Service Worker] New subscription:', subscription);
      // Kirim subscription baru ke server
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

// Fetch event - minimal handler untuk PWA
self.addEventListener('fetch', function (event) {
  // Hanya handle request ke origin yang sama
  if (event.request.url.startsWith(self.location.origin)) {
    // Tidak melakukan caching, langsung ke network
    // Ini untuk memastikan data selalu fresh
    return;
  }
});
