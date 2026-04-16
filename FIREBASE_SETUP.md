# Firebase & Firestore Setup Guide for SPS

Complete step-by-step guide to set up both Firebase Realtime Database and Firestore for the SPS messaging application.

## Prerequisites

- [ ] Google account and Firebase project
- [ ] Access to Firebase Console (https://console.firebase.google.com)
- [ ] Node.js 16+ (for admin SDK setup - optional)

## Part 1: Firebase Console Setup

### Step 1.1: Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Create a project**
3. Enter project name (e.g., "sps-messaging")
4. Accept Google Analytics option (optional)
5. Click **Create project**
6. Wait for provisioning (1-2 minutes)

### Step 1.2: Register Your Web App

1. In Firebase Console, click the **Web** icon (</> symbol)
2. Enter app name (e.g., "sps-web")
3. Check **Also set up Firebase Hosting** (optional)
4. Click **Register app**
5. Firebase will generate your config object - **COPY IT**

Example config (keep it safe):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxx...",
  authDomain: "sps-messaging.firebaseapp.com",
  databaseURL: "https://sps-messaging.firebaseio.com",
  projectId: "sps-messaging",
  storageBucket: "sps-messaging.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

6. Click **Next** and copy the initialization code
7. Update `src/config.js` with your config

---

## Part 2: Enable Authentication

### Step 2.1: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click **Email/Password**
3. Toggle **Enable**
4. Click **Save**

### Step 2.2: (Optional) Enable Other Auth Methods

- Google: Go to **Google** > **Enable** > Choose project support email
- GitHub: Go to **GitHub** > **Enable** > Add OAuth credentials

---

## Part 3: Firebase Realtime Database Setup

### Step 3.1: Create Realtime Database Instance

1. Go to **Realtime Database** in Firebase Console
2. Click **Create Database**
3. Select region (closest to your users is best)
4. Start in **Test Mode** (for development only!)
   - ⚠️ Test Mode allows anyone to read/write
   - This is fine for local development
5. Click **Enable**
6. Wait for database creation (30 seconds)

Your Realtime Database URL is: `https://YOUR-PROJECT-ID.firebaseio.com`

### Step 3.2: Deploy Realtime Database Rules

1. In Realtime Database, go to **Rules** tab
2. Copy the **Realtime Database rules** from [FIREBASE_RULES.md](FIREBASE_RULES.md)
   - Look for the section: "Complete Rules - Realtime Database"
3. Paste into the Rules editor in Firebase Console
4. Click **Publish**

**Expected warnings:** None (if you see warnings, check rule syntax)

### Step 3.3: Test Realtime Database Connection

In your browser console, test the connection:
```javascript
// In browser console (F12 > Console)
import { getCurrentUser, loginUser } from './src/firebase.js';

// First login
const result = await loginUser('test@example.com', 'password123');
console.log(result);  // Should be { success: true, user: {...} }
```

---

## Part 4: Firestore Setup

### Step 4.1: Create Firestore Instance

1. Go to **Firestore Database** in Firebase Console
2. Click **Create Database**
3. Start in **Test Mode**
4. Select region (same as Realtime Database)
5. Click **Enable**
6. Wait for database creation (2-3 minutes)

### Step 4.2: Create Channels Collection

1. In Firestore, click **Start collection** (if no data yet)
2. Collection ID: `channels` (exactly this)
3. Click **Next**
4. Document ID: `general`
5. Add fields:

| Field | Type | Value |
|-------|------|-------|
| `id` | string | `general` |
| `name` | string | `general` |
| `description` | string | `Public channel for server-wide discussions` |
| `creatorId` | string | `system` |
| `participantUids` | array | (empty array, leave as `[]`) |
| `createdAt` | timestamp | (current date/time) |
| `updatedAt` | timestamp | (current date/time) |

6. Click **Save**

### Step 4.3: Add Second Channel (Introductions)

1. In `channels` collection, click **Add document**
2. Document ID: `introductions`
3. Add same fields with updated values:

| Field | Type | Value |
|-------|------|-------|
| `id` | string | `introductions` |
| `name` | string | `introductions` |
| `description` | string | `Introduce yourself to the community` |
| `creatorId` | string | `system` |
| `participantUids` | array | `[]` |
| `createdAt` | timestamp | (current date/time) |
| `updatedAt` | timestamp | (current date/time) |

4. Click **Save**

### Step 4.4: Create channelHistory Collection (Empty)

1. Click **Start collection**
2. Collection ID: `channelHistory`
3. Document ID: `_placeholder` (we'll delete this)
4. Add one field: `placeholder` = `true`
5. Click **Save**
6. Right-click the `_placeholder` document and **Delete**

**Note:** The `channelHistory` collection structure looks like:
```
channelHistory/
├── {channelId}/
│   └── days/
│       └── {dateKey}/
│           ├── dateKey: string
│           ├── channelId: string
│           └── messages: array
```

This is created automatically when Cloud Functions write messages.

### Step 4.5: Deploy Firestore Rules

1. In Firestore, go to **Rules** tab
2. Copy the **Firestore rules** from [FIREBASE_RULES.md](FIREBASE_RULES.md)
   - Look for section: "Complete Rules - Firestore"
3. Paste into the Rules editor
4. Click **Publish**

**Test rule:** Make sure no syntax errors appear

---

## Part 5: Update App Configuration

### Step 5.1: Update src/config.js

```javascript
// src/config.js

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Optional: Cloud Functions endpoint (for message archival)
export const CLOUD_FUNCTION_URL = "https://REGION-YOUR_PROJECT_ID.cloudfunctions.net/archiveMessages";
```

Replace all values from your Firebase config that you copied in Step 1.2.

### Step 5.2: Verify Configuration

```bash
# Look for errors in browser console
npm run dev

# You should see:
# "Firebase initialized successfully"
```

---

## Part 6: Database Structure Overview

After setup, your databases should look like:

### Firestore Structure
```
channels/ (collection)
├── general (document)
│   ├── id: "general"
│   ├── name: "general"
│   ├── description: "Public channel..."
│   ├── creatorId: "system"
│   ├── participantUids: []
│   ├── createdAt: 2024-03-15T...
│   └── updatedAt: 2024-03-15T...
├── introductions (document)
│   ├── id: "introductions"
│   ├── name: "introductions"
│   ├── description: "Introduce yourself..."
│   ├── creatorId: "system"
│   ├── participantUids: []
│   ├── createdAt: 2024-03-15T...
│   └── updatedAt: 2024-03-15T...
└── (user-created channels)

channelHistory/ (collection)
├── general (document)
│   └── days/ (subcollection)
│       ├── 2024-03-15 (document)
│       │   ├── dateKey: "2024-03-15"
│       │   ├── channelId: "general"
│       │   └── messages: [...]
│       └── 2024-03-14 (document)
│           └── ...
└── (other channels)
```

### Realtime Database Structure
```
users/
├── {uid1}/
│   ├── uid: "user123"
│   ├── email: "user@example.com"
│   ├── username: "john_doe"
│   ├── createdAt: "2024-03-15T10:30:00Z"
│   ├── updatedAt: "2024-03-15T10:30:00Z"
│   └── lastSeen: "2024-03-15T10:35:00Z"
└── {uid2}/
    └── ...

queues/
└── server/
    ├── {messageId1}/ (waiting to be archived)
    └── {messageId2}/

inboxes/
├── {uid1}/
│   ├── {messageId1}/
│   └── {messageId2}/
└── {uid2}/
    └── ...

deliveryReceipts/
├── {messageId1}/
│   ├── {uid1}/
│   │   ├── username: "john_doe"
│   │   └── deliveredAt: "2024-03-15T10:31:00Z"
│   └── {uid2}/...
└── {messageId2}/...
```

---

## Part 7: Testing the Setup

### 7.1: Test Authentication

1. Start your app: `npm run dev`
2. Go to http://localhost:5173 (or your port)
3. Try registering a new account
4. Open Firebase Console > **Authentication**
5. You should see your user in the Users list

### 7.2: Test Firestore Read

```javascript
// Open browser console (F12)
// Test reading channels
import { getChannels } from './src/firebase.js';

const channels = await getChannels();
console.log(channels);
// Should output:
// [
//   { id: "general", name: "general", description: "...", participantUids: [] },
//   { id: "introductions", name: "introductions", ... }
// ]
```

### 7.3: Test Realtime Database Write & Read

```javascript
// In browser console
import { updateUserLastSeen } from './src/firebase.js';

const uid = "your-user-id";
await updateUserLastSeen(uid);
console.log("Last seen updated");

// Verify in Firebase Console > Realtime Database
// Look under users/{uid}/lastSeen
```

### 7.4: Test Message Sending

1. Login to app
2. Type a message in any channel
3. Click Send
4. Message should appear
5. Open Firebase Console > Realtime Database
6. Check `queues/server/` and `inboxes/{otherUserUid}/`

---

## Part 8: Cloud Functions (Optional but Recommended)

### Why Cloud Functions?

Cloud Functions automatically:
- ✅ Move messages from `queues/server` to Firestore `channelHistory`
- ✅ Keep message queues clean
- ✅ Archive historical messages
- ✅ Scale better than client-side archival

### 8.1: Create Cloud Function

1. Go to **Cloud Functions** in Firebase Console
2. Click **Create Function**
3. Settings:
   - **Name:** `archiveMessages`
   - **Runtime:** Node.js 20
   - **Trigger:** Cloud Pub/Sub (or RTDB on `queues/server`)
   - **Memory:** 512 MB
   - **Timeout:** 60 seconds

4. Copy the code below into `index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();
const firestore = admin.firestore();

exports.archiveMessages = functions.database
  .ref('queues/server/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageId = context.params.messageId;
    const message = snapshot.val();

    if (!message || !message.channelId || !message.dateKey) {
      console.error('Invalid message structure:', message);
      return;
    }

    try {
      // Add to Firestore channelHistory
      const dayRef = firestore.doc(
        `channelHistory/${message.channelId}/days/${message.dateKey}`
      );

      await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(dayRef);
        const messages = doc.exists ? doc.data().messages || [] : [];

        // Avoid duplicates
        if (messages.find((m) => m.id === messageId)) {
          return;
        }

        transaction.set(
          dayRef,
          {
            dateKey: message.dateKey,
            channelId: message.channelId,
            messages: [...messages, message]
          },
          { merge: true }
        );
      });

      // Delete from queue (already archived)
      await db.ref(`queues/server/${messageId}`).remove();

      console.log(`Archived message ${messageId}`);
    } catch (error) {
      console.error('Error archiving message:', error);
      throw error;
    }
  });
```

5. Click **Deploy**
6. Wait for deployment (2-3 minutes)

### 8.2: Test Cloud Function

1. Send a message from app
2. Open Firebase Console > Cloud Functions
3. Check **Logs** tab
4. You should see: `Archived message {messageId}`
5. Check Firestore > `channelHistory` > should have message

---

## Part 9: Production Deployment Checklist

Before going to production:

- [ ] Switch Realtime Database from **Test Mode** to **Locked Mode**
- [ ] Switch Firestore from **Test Mode** to **Locked Mode**
- [ ] Deploy security rules from [FIREBASE_RULES.md](FIREBASE_RULES.md)
- [ ] Enable billing on Firebase project (required for production)
- [ ] Set up Cloud Functions for message archival
- [ ] Create backup strategy (Firebase > Project Settings > Backup)
- [ ] Enable Google Cloud Audit Logs
- [ ] Test login/messaging flow end-to-end
- [ ] Monitor usage at Firebase Console > Usage
- [ ] Set up alerts for quota usage

### Production Rules Summary

**Realtime Database:**
- Default deny all
- Users can only read profiles
- Users can only write own profile
- Messages append-only

**Firestore:**
- Default deny all
- Authenticated users can read channels
- Only channel creator can modify
- Message history is read-only from client

---

## Troubleshooting

### "Permission denied" when fetching channels

**Cause:** Firestore rules not deployed or missing authentication

**Solution:**
1. Verify rules are deployed: Firestore > Rules > Check for syntax errors
2. Verify user is logged in: Check browser console for auth errors
3. Test rules: Firestore > Rules > Simulator tab

### "No channels found in Firestore"

**Cause:** Channels collection doesn't exist or is empty

**Solution:**
1. Go to Firestore Console
2. Verify `channels` collection exists
3. Add at least 2 documents: `general` and `introductions`
4. Verify fields match DATABASE_STRUCTURE.md

### Messages not appearing

**Cause:** Queue archival not working or Firestore not accessible

**Solution:**
1. Check Cloud Functions logs
2. Verify `channelHistory` collection exists
3. Check Realtime Database rules allow write to `queues/server`
4. Check Firestore rules allow read from `channelHistory`

### "databaseURL is undefined"

**Cause:** Config not loaded properly

**Solution:**
1. Update `src/config.js` with your Firebase config
2. Restart dev server: `npm run dev`
3. Check browser console for config errors

### High Realtime Database costs

**Cause:** Inefficient queries or subscriptions

**Solution:**
1. Add `.indexOn` for queried fields
2. Unsubscribe from listeners in `destroy()` methods
3. Limit message history loads (don't load all messages at once)
4. Archive old messages to reduce RTDB storage

---

## Quick Reference: Firebase URLs & IDs

Save these values for your project:

```
Project ID:              _____________________
Realtime DB URL:         _____________________
Firestore Project:       _____________________
Auth Domain:             _____________________
API Key:                 _____________________
Firebase Console:        https://console.firebase.google.com
Realtime DB Console:     https://console.firebase.google.com?forcedb=current
Firestore Console:       https://console.firebase.google.com
Authentication Tab:      https://console.firebase.google.com > Auth
Cloud Functions:         https://console.firebase.google.com > Functions
```

---

## Next Steps

1. ✅ Complete setup above
2. 📖 Read [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) for detailed structure
3. 🔒 Review [FIREBASE_RULES.md](FIREBASE_RULES.md) for security rules
4. 🚀 Deploy to production following the checklist
5. 📊 Monitor usage in Firebase Console

---

For questions or issues, refer to [README.md](README.md) or Firebase documentation.
