// A unique name for the cache
const CACHE_NAME = 'eklavya-coaching-v1';

// A list of all the essential files to be cached for offline use
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
  // NOTE: If you add local images or CSS files, you must add their paths here too.
  // For example: './images/logo.png'
];

// Event listener for the 'install' event.
// This is where we open the cache and add our essential files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event listener for the 'fetch' event.
// This intercepts all network requests.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the requested resource is found in the cache, return it.
        if (response) {
          return response;
        }
        // Otherwise, fetch the resource from the network.
        return fetch(event.request);
      }
    )
  );
});

// Event listener for the 'activate' event.
// This is where we clean up old, unused caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listener for push events (from a push server, not used in this client-only version)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Announcement';
  const options = {
    body: data.body || 'Check the app for new updates!',
    icon: 'https://placehold.co/192x192/4f46e5/ffffff?text=E',
    tag: 'announcement'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener for notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Close the notification

  // This looks for an open window with the app's URL and focuses it.
  event.waitUntil(clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clientList => {
    // If a window is already open, focus it.
    for (const client of clientList) {
      // Note: Adjust the URL if your app isn't at the root.
      if ('focus' in client) {
        return client.focus();
      }
    }
    // Otherwise, open a new window.
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});
