# Push Notification Debugging Guide

## What I've Fixed

1. ✅ **Created Service Worker** (`public/firebase-messaging-sw.js`)
   - Handles background push notifications
   - Shows notifications when the app tab is closed
   - Handles notification clicks

2. ✅ **Updated Firebase Configuration** (`src/firebase.js`)
   - Service Worker registration on app startup
   - Improved FCM token retrieval with service worker registration
   - Better error logging and debugging
   - Stores FCM token in localStorage for inspection

3. ✅ **Updated App Setup** (`src/App.jsx`)
   - Now uses the ACCESS_TOKEN for authentication
   - Passes proper credentials to registerPushToken

## How to Test Push Notifications

### Step 1: Check Browser Console for FCM Token
1. Open your app in the browser
2. Open DevTools → Console tab
3. Look for logs like:
   - `✅ Service Worker registered successfully`
   - `✅ Notification permission granted`
   - `✅ FCM Token obtained: [token_here]`
   - `✅ FCM token registered with backend — push notifications active`

### Step 2: Verify FCM Token Registration
1. In the Console, run:
   ```javascript
   localStorage.getItem("fcmToken")
   ```
2. You should see a long token string (not empty)

### Step 3: Check Your Backend
Make sure your backend:
- ✅ Receives the FCM token from `/api/notifications/fcm-token` endpoint
- ✅ Stores it correctly in Novu
- ✅ Uses that token when sending push notifications

### Step 4: Send a Test Push Notification
From your backend, send a push notification to the subscriber ID:
```
BUS-J872IVFJ7HH5U1IK20KA6
```

### Common Issues & Solutions

#### ❌ "The registration token is not a valid FCM registration token"
**This means:**
- Your backend stored an invalid/expired FCM token
- Possible causes:
  1. Service Worker is not registered
  2. VAPID key doesn't match Firebase project settings
  3. Token wasn't stored properly in Novu

**Solutions:**
1. Clear browser data: DevTools → Application → Clear site data
2. Reload the app and check the console for errors
3. Verify your Firebase VAPID key in Firebase Console:
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Compare the VAPID key with what's in `src/firebase.js` (line 46)

#### ❌ No Service Worker logs
**This means:**
- Service Worker failed to register
- Check:
  1. Is the app running on `localhost` (Service Workers require HTTPS or localhost)?
  2. Is `public/firebase-messaging-sw.js` being served?
  3. Browser console for registration errors

#### ❌ "Notification permission denied"
**This means:**
- You need to grant notification permissions
- Click the bell icon in browser address bar → Allow notifications
- Or clear site data and reload to see the permission prompt again

### Step 5: Verify Permissions
1. In Chrome: Address bar → Lock icon → Notifications → should be "Allow"
2. If "Block": Click → Change to "Allow" and reload app

## Files Modified/Created

| File | Change |
|------|--------|
| `src/firebase.js` | Enhanced FCM token registration with service worker |
| `src/App.jsx` | Updated to use ACCESS_TOKEN for auth |
| `public/firebase-messaging-sw.js` | **NEW** - Service Worker for background notifications |

## Testing Checklist

- [ ] No errors in browser console
- [ ] "FCM Token obtained" message appears
- [ ] "FCM token registered with backend" message appears
- [ ] `localStorage.getItem("fcmToken")` returns a valid token
- [ ] Service Worker shows as "active" in DevTools → Application → Service Workers
- [ ] Can send a test push notification from backend
- [ ] Push notification appears even when app tab is closed

---

If push notifications still don't work after this, check:
1. Backend is properly storing the FCM token in Novu
2. VAPID key in Firebase is correct
3. Backend has proper Firebase Cloud Messaging credentials

