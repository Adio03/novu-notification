# Novu Bell + Backend Integration Guide

## Overview
This setup integrates Novu for in-app notifications following this flow:
```
Backend → Novu (event trigger) → Stored notification → Frontend Bell fetches by subscriberId
```

## Frontend Components

### 1. **NovuProvider.jsx** - Initialization Wrapper
Wraps your app to initialize the Novu Notification Center with subscriber identity.

**Props:**
- `subscriberId` (required): Unique identifier for the user
- `apiKey` (required): Novu API key from environment
- `backendUrl` (optional): Novu backend URL

### 2. **NotificationBell.jsx** - UI Component
Displays the notification bell icon and notification dropdown.

**Props:**
- `position` (default: "top-right"): Bell position ("top-right", "top-left", "bottom-right", "bottom-left")
- `theme` (default: "light"): Theme ("light" or "dark")

## Setup Instructions

### Step 1: Environment Variables
Create a `.env` file with:
```
REACT_APP_NOVU_API_KEY=your_novu_api_key
REACT_APP_NOVU_BACKEND_URL=https://api.novu.co
```

### Step 2: Update Your App Component
Wrap your app with `NovuNotificationProvider`:
```jsx
import NovuNotificationProvider from './NovuProvider';
import NotificationBell from './NotificationBell';

function App() {
  return (
    <NovuNotificationProvider
      subscriberId={currentUserId}
      apiKey={process.env.REACT_APP_NOVU_API_KEY}
      backendUrl={process.env.REACT_APP_NOVU_BACKEND_URL}
    >
      <YourApp />
      <NotificationBell />
    </NovuNotificationProvider>
  );
}
```

### Step 3: Backend Integration (Java)
Your Java backend should:

1. **Trigger Novu Workflow**
   ```java
   // Initialize Novu client with your API key
   Novu novu = new Novu(System.getenv("NOVU_API_KEY"));

   // Trigger workflow event
   novu.triggerEvent(
     "workflow-identifier",  // From Novu dashboard
     subscriberId,           // Same ID as frontend
     payload                 // Your notification data
   );
   ```

2. **Subscriber Identity (Important)**
   - Use the SAME `subscriberId` in both backend and frontend
   - `subscriberId` should be unique per user
   - Can be email, UUID, or any unique string

3. **Topic Management (Backend Only)**
   - Do NOT subscribe frontend to topics
   - Handle topic subscriptions in Java backend if needed:
   ```java
   novu.subscriberClient().addSubscriberToTopic(
     subscriberId,
     topicKey,
     {"name": "topic-name"}
   );
   ```

## Architecture Flow

```
User Login
    ↓
Backend: Get/Create Novu Subscriber (if needed)
    ↓
Frontend: Load user, get subscriberId
    ↓
Frontend: NovuProvider initializes with subscriberId
    ↓
Frontend: NotificationBell displays and fetches notifications
    ↓
Backend Event: Trigger Novu workflow with subscriberId
    ↓
Novu: Stores notification for that subscriber
    ↓
Frontend: Bell auto-fetches and displays new notification
```

## Important Notes

✅ **Frontend does NOT subscribe to topics**
- Bell automatically fetches notifications for the subscriberId
- No manual topic subscription in frontend code

✅ **Subscriber Identity is Consistent**
- Backend and frontend must use the same subscriberId
- Ensures notifications reach the correct user

✅ **Topics (if used) Managed from Backend Only**
- Backend can subscribe subscribers to topics
- Frontend topics handled automatically by Bell

✅ **Production-Ready**
- Error handling for missing subscriberId/apiKey
- Environment variables for configuration
- Proper cleanup and context management

## Testing

1. Install dependencies: `npm install`
2. Add environment variables to `.env`
3. Get a valid `subscriberId` from your auth system
4. Mount the components in your app
5. Trigger a workflow from your Java backend
6. Check if notification appears in the Bell

## Customization

### Custom Notification Handler
```jsx
import { useNotificationCenter } from '@novu/notification-center';

function MyComponent() {
  const { notifications } = useNotificationCenter();
  
  return (
    <div>
      {notifications.map(n => (
        <div key={n.id}>{n.content}</div>
      ))}
    </div>
  );
}
```

### Styling
The NotificationBell supports theme and position props for basic customization.
For advanced styling, use Novu's CSS customization options in the dashboard.

## Support
Refer to [Novu Documentation](https://docs.novu.co/) for more details.
