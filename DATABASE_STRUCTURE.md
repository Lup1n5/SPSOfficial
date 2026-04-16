# SPS Database Structure Guide

## Overview

SPS uses **two Firebase services**:
1. **Firebase Realtime Database (RTDB)** - For real-time messaging queues, inboxes, and user profiles
2. **Firestore** - For message history, channel metadata, and scalable storage

## Complete Database Structure

### Firebase Realtime Database

```
root/
├── users/
│   └── {uid}/
│       ├── uid: string (user ID)
│       ├── email: string
│       ├── username: string (3-30 chars)
│       ├── createdAt: ISO timestamp
│       ├── updatedAt: ISO timestamp
│       └── lastSeen: ISO timestamp
│
├── queues/
│   └── server/
│       └── {messageId}/
│           ├── id: string
│           ├── channelId: string
│           ├── senderUid: string
│           ├── senderUsername: string
│           ├── text: string (null if deleted)
│           ├── timestamp: ISO timestamp
│           ├── dateKey: YYYY-MM-DD
│           ├── edited: boolean
│           ├── deleted: boolean
│           ├── replyToMessageId: string | null
│           ├── isPing: boolean
│           └── recipients: array of uid strings
│
├── inboxes/
│   └── {uid}/
│       └── {messageId}/
│           └── (same structure as queues/server/{messageId})
│
└── deliveryReceipts/
    └── {messageId}/
        └── {uid}/
            ├── username: string
            └── deliveredAt: ISO timestamp

```

### Firestore

```
firestore/
├── channels/ (collection)
│   └── {channelId}/ (document)
│       ├── id: string
│       ├── name: string
│       ├── description: string
│       ├── creatorId: string (uid)
│       ├── participantUids: array of uid strings
│       ├── createdAt: ISO timestamp
│       └── updatedAt: ISO timestamp
│
└── channelHistory/ (collection)
    └── {channelId}/ (document - subcollection root)
        └── days/ (subcollection)
            └── {dateKey}/ (document - YYYY-MM-DD)
                ├── dateKey: string
                ├── channelId: string
                └── messages: array of message objects
                    └── [
                        {
                            id: string,
                            channelId: string,
                            senderUid: string,
                            senderUsername: string,
                            text: string | null,
                            timestamp: ISO timestamp,
                            dateKey: YYYY-MM-DD,
                            edited: boolean,
                            deleted: boolean,
                            replyToMessageId: string | null,
                            isPing: boolean,
                            recipients: array of uid strings
                        },
                        ...
                      ]

```

## Data Flow

### Sending a Message
1. User submits message in UI
2. `enqueueMessageForDelivery()` adds to `queues/server/{messageId}` in RTDB
3. Message is also added to `inboxes/{recipientUid}/{messageId}` for each recipient
4. Backend Cloud Function processes queue and stores in Firestore `channelHistory/{channelId}/days/{dateKey}/messages[]`
5. User receives delivery receipts in `deliveryReceipts/{messageId}/{uid}`

### Loading Channels
1. App calls `getChannels()`
2. Queries Firestore `channels` collection
3. Returns sorted list of all channels

### Loading Messages
1. App calls `getMessagesForDay(channelId, dateKey)`
2. Queries Firestore `channelHistory/{channelId}/days/{dateKey}` document
3. Returns sorted array of normalized messages

### Real-time Updates
1. User subscribes to inbox with `subscribeToInbox(uid, callback)`
2. Firebase triggers `onChildAdded` for new messages in `inboxes/{uid}/`
3. Message is passed to callback and rendered
4. User acknowledges with `acknowledgeInboxMessage()` which deletes from inbox

## Key Design Decisions

### Why Split Between RTDB and Firestore?

| Property | RTDB | Firestore |
|----------|------|-----------|
| Real-time subscriptions | ✅ Excellent | Good but higher cost |
| Ephemeral data (queues, inboxes) | ✅ Best | Wastes storage quota |
| Historical data (archives) | Large & slow | ✅ Scalable & indexed |
| Cost | ✅ Cheaper for volume | More expensive at scale |

**RTDB stores:** Live messaging queue, delivery queue, inboxes, live recipts
**Firestore stores:** Channels, historical messages, user metadata (via functions)

### Why Use `messages[]` Array in Firestore?

Messages for each day are stored in a single array document because:
- ✅ Single atomic read per day (faster than hundreds of docs)
- ✅ Smaller query footprint
- ✅ Messages naturally group by date
- ⚠️ Max document size is 1MB (~10k typical messages/day)

For servers with >10k messages/day, switch to subcollection:
```javascript
// Alternative: channelHistory/{channelId}/days/{dateKey}/messages/{messageId}
```

## Setup Checklist

### 1. Firebase Console Setup

#### Realtime Database
- [ ] Create Realtime Database in region
- [ ] Start in **Test Mode** (for development)
- [ ] Switch to **Locked Mode** with rules (for production)
- [ ] Deploy rules from FIREBASE_RULES.md

#### Firestore
- [ ] Create Firestore instance in region
- [ ] Start in **Test Mode** (for development)
- [ ] Create seed data:
  - [ ] Create `channels` collection
  - [ ] Add first channel document with ID `general`
  - [ ] Add second channel document with ID `introductions`
- [ ] Deploy rules from FIREBASE_RULES.md (Firestore section)

#### Indexes
- [ ] Optional: Create composite indexes for pagination:
  ```
  Collection: channelHistory/{channelId}/days
  Fields: dateKey (Descending), timestamp (Descending)
  ```

### 2. Create Seed Data

Use Firebase Console or admin SDK:

```javascript
// Firestore - channels collection
// Document ID: general
{
  id: "general",
  name: "general",
  description: "Public channel for server-wide discussions",
  creatorId: "system",
  participantUids: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}

// Document ID: introductions
{
  id: "introductions",
  name: "introductions",
  description: "Introduce yourself to the community",
  creatorId: "system",
  participantUids: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### 3. Cloud Functions (Optional but Recommended)

Set up Cloud Functions to:
1. Move messages from `queues/server` to Firestore on write
2. Update `channelHistory/{channelId}/days/{dateKey}/messages[]`
3. Clean up processed queue entries

Example trigger: `firebase.database().ref('queues/server/{messageId}').onCreate(...)`

### 4. Environment Variables

Update `src/config.js`:
```javascript
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  databaseURL: "https://....firebaseio.com",
  projectId: "...",
  storageBucket: "....",
  messagingSenderId: "...",
  appId: "..."
};
```

## Security Rules

### Realtime Database Rules
See FIREBASE_RULES.md - Realtime Database section

### Firestore Rules
See FIREBASE_RULES.md - Firestore section

## Example Queries

### Get all channels
```javascript
const snapshot = await getDocs(collection(firestore, 'channels'));
const channels = snapshot.docs.map(doc => doc.data());
```

### Get today's messages for a channel
```javascript
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const dayRef = doc(firestore, 'channelHistory', channelId, 'days', today);
const snapshot = await getDoc(dayRef);
const messages = snapshot.data()?.messages || [];
```

### Get messages for a specific date
```javascript
const dateKey = "2024-03-15"; // YYYY-MM-DD format
const dayRef = doc(firestore, 'channelHistory', channelId, 'days', dateKey);
const snapshot = await getDoc(dayRef);
const messages = snapshot.data()?.messages || [];
```

## Troubleshooting

### "No matching documents" when loading messages
- **Cause:** Messages haven't been archived to Firestore yet
- **Solution:** Send test message first, wait for async processing, then query

### "Permission denied" on Firestore queries
- **Cause:** Security rules not properly deployed
- **Solution:** Check Firestore Rules tab in Firebase Console

### "Cannot read messages for date" 
- **Cause:** Using wrong date format
- **Solution:** Always use `YYYY-MM-DD` format from `getTodayDateKey()`

### High Realtime Database bills
- **Cause:** Too many subscriptions or reads
- **Solution:** Profile with Firebase Performance Monitoring, add `.indexOn` rules

## Scaling Considerations

### Current Limits
- ✅ ~100 concurrent users
- ✅ ~1000 messages/day/channel
- ✅ ~10MB/month data transfer

### At 1000+ users, consider:
- Migrate to Firestore for channels and user profiles
- Use Cloud Pub/Sub for message distribution instead of push to all inboxes
- Implement channel subscriptions (users only receive messages they subscribe to)
- Archive old messages to Cloud Storage

