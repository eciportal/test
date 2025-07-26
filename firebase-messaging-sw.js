// Corrected firebase-messaging-sw.js

// --- START: Firebase Cloud Messaging Logic ---

// Import Firebase scripts using the correct method for service workers
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

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

// Initialize the Firebase app
firebase.initializeApp(firebaseConfig);

// Get an instance of Firebase Messaging
const messaging = firebase.messaging();

// This handler will be executed when the app is in the background or completely closed.
messaging.onBackgroundMessage((payload) => {
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


// --- START: PWA Caching Logic (Your existing code) ---

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
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          return networkResponse;
        });
      });
    })
  );
});

// --- END: PWA Caching Logic ---


// --- START: Notification Click Handler (Your existing code) ---

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

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
      return clients.openWindow('/');
    }
  }));
});

// --- END: Notification Click Handler ---
