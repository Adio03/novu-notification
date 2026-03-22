import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey:            "AIzaSyAP2vkQB_rMz4vBgoN_aNbPEL5H7BtS91c",
    authDomain:        "recital-notification.firebaseapp.com",
    projectId:         "recital-notification",
    storageBucket:     "recital-notification.firebasestorage.app",
    messagingSenderId: "329339029402",
    appId:             "1:329339029402:web:00b301772bd3608ddbdc23",
    measurementId:     "G-26GM08RB18"
};


const app       = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function registerPushToken(subscriberId, jwtToken) {
    try {
        console.log("Registering push token for:", subscriberId);

        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied.");
            return;
        }
        console.log(" Notification permission granted.");

        // 2. Register service worker
        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });

        // 3. Wait until fully active
        await waitForServiceWorkerActive(swReg);
        console.log("Service Worker active.");

        // 4. Get FCM token — correct VAPID key from recital-notification Firebase project
        const fcmToken = await getToken(messaging, {
            vapidKey:                  "BBoTWIz-pk7IHEC953bKhWZY41TtJ5ZX2E3Y3vrFB2wsFpg2Oge5ZswEhD9YUqU0U3F5EnZcZwWhxtt4BX50gEw",
            serviceWorkerRegistration: swReg
        });

        if (!fcmToken) {
            console.error("❌ No FCM token — check VAPID key.");
            return;
        }

        console.log("✅ FCM Token:", fcmToken);
        localStorage.setItem("fcmToken", fcmToken);

        // 5. Auto-POST to backend
        const res = await fetch("http://localhost:801/api/notifications/fcm-token", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ subscriberId, fcmToken })
        });

        if (res.ok) {
            console.log("✅ FCM token registered with backend — push active.");
        } else {
            console.error("❌ Backend failed:", res.status, await res.text());
        }

    } catch (err) {
        console.error("❌ registerPushToken error:", err.message);
    }
}

function waitForServiceWorkerActive(registration) {
    return new Promise((resolve) => {
        if (registration.active) {
            resolve();
            return;
        }
        const sw = registration.installing || registration.waiting;
        if (!sw) { resolve(); return; }
        sw.addEventListener("statechange", function handler(e) {
            if (e.target.state === "activated") {
                sw.removeEventListener("statechange", handler);
                resolve();
            }
        });
    });
}

export function onForegroundMessage(callback) {
    onMessage(messaging, (payload) => {
        console.log("🔔 Foreground push:", JSON.stringify(payload, null, 2));

        const title = payload.notification?.title
            || payload.data?.title
            || payload.data?.subject
            || "New Notification";

        const body  = payload.notification?.body
            || payload.data?.body
            || payload.data?.message
            || "";

        callback({ ...payload, title, body });
    });
}

export { app, messaging };