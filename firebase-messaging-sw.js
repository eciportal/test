// Import and initialize the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-sw.js";

// --- START: PWA Caching Logic (Merged from your service-worker.js) ---

// A unique name for the cache
const CACHE_NAME = 'eklavya-coaching-v2'; // Incremented version

// A list of all the essential files to be cached for offline use
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js'
];

// Event listener for the 'install' event.
// This is where we open the cache and add our essential files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential assets.');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Event listener for the 'fetch' event.
// This intercepts network requests to serve cached content when offline.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return the cached response if it exists.
        if (response) {
          // console.log(`Serving from cache: ${event.request.url}`);
          return response;
        }

        // Otherwise, fetch from the network.
        return fetch(event.request).then(networkResponse => {
          // console.log(`Fetching from network: ${event.request.url}`);
          // Optionally, cache the new response for future use.
          // Be careful with what you cache, especially for non-static assets.
          // For example, you might not want to cache API responses from Firestore here.
          return networkResponse;
        });
      });
    })
  );
});


// --- END: PWA Caching Logic ---


// --- START: Firebase Cloud Messaging Logic ---

// Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDWkPt4hWE5hSx5XOZDo_0clnEzYnJMTnI",
    authDomain: "studentid-3132e.firebaseapp.com",
    projectId: "studentid-3132e",
    storageBucket: "studentid-3132e.appspot.com",
    messagingSenderId: "358629211169",
    appId: "1:358629211169:web:4ee8912293caabb312f760",
    measurementId: "G-M9N66VYHVV"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// This handler will be executed when the app is in the background or completely closed.
onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize the notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://placehold.co/192x192/4f46e5/ffffff?text=E' // Your PWA icon
    };

    // The service worker shows the notification.
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- END: Firebase Cloud Messaging Logic ---


// --- START: Notification Click Handler ---

// This listener handles what happens when a user clicks on the notification.
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close(); // Close the notification

  // This looks for an open window with the app's URL and focuses it.
  // If no window is open, it opens a new one.
  event.waitUntil(clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clientList => {
    for (const client of clientList) {
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      // Opens the app. You could also make this open a specific page,
      // e.g., clients.openWindow('/#dashboard')
      return clients.openWindow('/');
    }
  }));
});

// --- END: Notification Click Handler ---
