
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey:            "AIzaSyAP2vkQB_rMz4vBgoN_aNbPEL5H7BtS91c",
    authDomain:        "recital-notification.firebaseapp.com",
    projectId:         "recital-notification",
    storageBucket:     "recital-notification.firebasestorage.app",
    messagingSenderId: "329339029402",
    appId:             "1:329339029402:web:00b301772bd3608ddbdc23"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background push received:", payload);

    const title = payload.notification?.title
        || payload.data?.title
        || "New Notification";

    const body  = payload.notification?.body
        || payload.data?.body
        || payload.data?.message
        || "";

    self.registration.showNotification(title, {
        body: body,
        icon: "/favicon.ico"
    });
});