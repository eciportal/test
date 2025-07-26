// Import and initialize the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-sw.js";

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

// This handler will be executed when the app is in the background or completely closed
onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://placehold.co/192x192/4f46e5/ffffff?text=E'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
