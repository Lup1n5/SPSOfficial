# iOS PWA Push Notifications Setup

## What's Implemented

✅ **iOS PWA Compatible Service Worker** - Uses standard Web Push API instead of FCM
✅ **Visibility Detection** - Notifications only appear when app is in background
✅ **Push Subscription Management** - Stores subscriptions in Firebase Realtime Database
✅ **Message-triggered Notifications** - Sends push notifications when users send messages
✅ **Proper PWA Manifest** - iOS PWA meta tags and manifest for installability

## How It Works

1. **App Registration**: When users log in, they're prompted for notification permission
2. **Subscription Storage**: Push subscriptions are stored in `pushSubscriptions/{uid}` in Firebase
3. **Message Flow**: When a user sends a message:
   - Message is saved to Firebase
   - Notification payload is queued in `notificationQueue/{timestamp}`
   - Backend server processes the queue and sends notifications to all users except sender
4. **Smart Notifications**: 
   - If app is in foreground: Message appears in chat only
   - If app in background: Push notification is shown

## iOS PWA Installation

1. Open the app in Safari on iOS
2. Tap the Share button
3. Select "Add to Home Screen" 
4. Open from Home Screen (not Safari)
5. Grant notification permission when prompted

## Backend Setup Required

For notifications to actually be sent, you need a backend server running `notification-server.js`:

```bash
# Install dependencies
npm install firebase-admin web-push

# Generate VAPID keys
npx web-push generate-vapid-keys

# Update notification-server.js with:
# - Your private VAPID key
# - Firebase service account JSON path
# - Your email in VAPID details

# Run the server
node notification-server.js
```

## Files Modified

- `sw.js` - iOS PWA service worker with push notification handling
- `main.js` - Push subscription management and notification triggering  
- `index.html` & `SPiN.html` - iOS PWA meta tags
- `vite.config.js` - Include service worker in build
- `notification-server.js` - Backend notification processor (optional)

## Database Structure

```
pushSubscriptions/
  {uid}/
    endpoint: "..."
    keys:
      p256dh: "..."
      auth: "..."
    userEmail: "..."

notificationQueue/
  {timestamp}/
    payload: { title, body, icon, ... }
    senderUid: "..."
    subscriptions: { ... }
    timestamp: 123456789
```

## Testing

1. Build and serve the app: `npm run build && npm run preview`
2. Install as PWA on iOS device
3. Log in with different accounts on different devices
4. Send messages and verify notifications appear only when app is in background

## Limitations

- iOS PWA notifications require the app to be installed from Home Screen
- Backend server required for actual notification delivery
- iOS PWA notification support varies by iOS version (16.4+ recommended)
