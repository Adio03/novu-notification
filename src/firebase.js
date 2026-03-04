import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey:            "AIzaSyAP2vkQB_rMz4vBgoN_aNbPEL5H7BtS91c",
    authDomain:        "recital-notification.firebaseapp.com",
    projectId:         "recital-notification",
    storageBucket:     "recital-notification.firebasestorage.app",
    messagingSenderId: "329339029402",
    appId:             "1:329339029402:web:00b301772bd3608ddbdc23",
    measurementId:     "G-26GM08RB18"
};

// Initialize Firebase
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

/**
 * Requests browser notification permission, gets the real FCM token
 * for this browser/device, and registers it with your backend.
 *
 * Call this on app load or after login.
 *
 * @param {string} subscriberId — e.g. "BUS-J872IVFJ7HH5U1IK20KA6"
 * @param {string} jwtToken     — user's JWT for backend auth
 */
export async function registerPushToken(subscriberId, jwtToken) {
    try {
        // 1. Ask browser for notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied by user.");
            return;
        }

        // 2. Get real FCM token for this browser using your VAPID key
        const fcmToken = await getToken(messaging, {
            vapidKey: "BBLh53iniDnUyBJ89lGFK86Jc_9lRnUEzhTNj-wY6yFEVZqWbTM8rf2hIB-QOECmQQqS6XCp2yUVcEROv7TLz9U"
        });

        if (!fcmToken) {
            console.warn("No FCM token received — check VAPID key and Firebase config.");
            return;
        }

        console.log("✅ FCM Token obtained:", fcmToken);

        // 3. Send token to your backend → NovuSubscriberService stores it in Novu
        const response = await fetch("http://localhost:8080/api/notifications/fcm-token", {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ subscriberId, fcmToken })
        });

        if (response.ok) {
            console.log("✅ FCM token registered with backend — push notifications active.");
        } else {
            console.error("❌ Backend FCM registration failed:", await response.text());
        }

    } catch (error) {
        console.error("Error registering FCM push token:", error);
    }
}

/**
 * Listens for push notifications while the app tab is open (foreground).
 * Background notifications are handled by firebase-messaging-sw.js.
 *
 * @param {function} onReceived — callback with the notification payload
 */
export function onForegroundMessage(onReceived) {
    onMessage(messaging, (payload) => {
        console.log("Foreground push received:", payload);
        onReceived(payload);
    });
}

export { app, analytics, messaging };