# SPS Database Architecture Diagram

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPS Web Client                              │
│  (Browser - React/Vanilla JS)                                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Firebase SDK
             │ (initializeApp, getAuth, getDatabase, getFirestore)
             │
       ┌─────┴────────────────────────────────────────────────────┐
       │                                                           │
  ┌────▼─────────────────────────┐       ┌────────────────────────▼──┐
  │  Firebase Auth Service       │       │  Cloud Firestore           │
  │  (Email/Password, Google)    │       │  - Channels collection     │
  │                              │       │  - Message history         │
  └──────────────────────────────┘       │  - Archive (read-only)     │
                                         └────────────────────────────┘
       │
       ├─────────────────────────────────────────────────?────────┐
       │                                                           │
  ┌────▼─────────────────────────┐       ┌────────────────────────▼──┐
  │  Firebase Realtime Database  │       │  Cloud Functions           │
  │  (RTDB)                      │       │  (Message Archival)        │
  │                              │       │                            │
  │  ├── users/                  │       │  Trigger: queues/server    │
  │  ├── queues/                 │       │  Action: Archive to        │
  │  ├── inboxes/                │       │          Firestore         │
  │  └── deliveryReceipts/       │       │                            │
  └──────────────────────────────┘       └────────────────────────────┘
```

## Data Flow Diagram: Sending a Message

```
1. USER TYPES MESSAGE
   │
   └─> handleMessageSubmit()
        │
        ├─> Create optimistic message (pending)
        │   {id: "local-123", pending: true, text: "Hello"}
        │
        └─> UI: Show message as "Sending..."

2. SEND TO FIREBASE
   │
   └─> enqueueMessageForDelivery()
        │
        ├─> Get channel recipients
        │
        └─> Create message envelope:
            {
              id: "msg-abc123",
              channelId: "general",
              senderUid: "user456",
              senderUsername: "john_doe",
              text: "Hello",
              timestamp: "2024-03-15T10:30:00Z",
              dateKey: "2024-03-15",
              recipients: ["user789", "user012"]
            }

3. WRITE TO REALTIME DATABASE
   │
   ├─> path: queues/server/msg-abc123
   │   (Server processes this)
   │
   └─> path: inboxes/{each recipient}/msg-abc123
       (Each recipient receives in their inbox)

4. CLOUD FUNCTION LISTENS
   │
   └─> Trigger: queues/server/{messageId} created
        │
        └─> Move message to Firestore:
            channelHistory/general/days/2024-03-15/messages[]
            │
            └─> Delete from queues/server/msg-abc123

5. TRACK DELIVERY
   │
   └─> subscribeToDeliveryReceipts("msg-abc123")
        │
        ├─> deliveryReceipts/msg-abc123/user789
        │   {username: "jane", deliveredAt: "..."}
        │
        └─> deliveryReceipts/msg-abc123/user012
            {username: "bob", deliveredAt: "..."}

6. UI UPDATES
   │
   ├─> Remove optimistic message
   │   (Replace with confirmed message from server)
   │
   └─> Show delivery status:
       ✓ Delivered (2/2)
       └─> jane, bob
```

## Realtime Database Structure (RTDB)

```
📦 RTDB Root
│
├── 📁 users/                          (User profiles)
│   └── 📄 {uid}/
│       ├── "uid": "auth123"
│       ├── "email": "user@example.com"
│       ├── "username": "john_doe"
│       ├── "createdAt": "2024-03-15T10:00:00Z"
│       ├── "updatedAt": "2024-03-15T10:30:00Z"
│       └── "lastSeen": "2024-03-15T10:35:00Z"
│
├── 📁 queues/                        (Message queue for processing)
│   └── 📁 server/
│       └── 📄 msg-abc123/           ⏳ Being processed
│           ├── "id": "msg-abc123"
│           ├── "channelId": "general"
│           ├── "senderUid": "user456"
│           ├── "senderUsername": "john_doe"
│           ├── "text": "Hello everyone!"
│           ├── "timestamp": "2024-03-15T10:30:00Z"
│           ├── "dateKey": "2024-03-15"
│           ├── "recipients": ["user789", "user012"]
│           ├── "edited": false
│           ├── "deleted": false
│           ├── "isPing": false
│           └── "replyToMessageId": null
│
├── 📁 inboxes/                      (Real-time message delivery)
│   ├── 📁 user789/
│   │   └── 📄 msg-abc123/          👆 Unread message
│   │       ├── "id": "msg-abc123"
│   │       ├── "channelId": "general"
│   │       ├── "senderUid": "user456"
│   │       ├── "senderUsername": "john_doe"
│   │       ├── "text": "Hello everyone!"
│   │       └── ... (same as queue)
│   │
│   └── 📁 user012/
│       └── 📄 msg-abc123/          👆 Unread message
│           └── ... (same structure)
│
└── 📁 deliveryReceipts/            (Delivery confirmation)
    └── 📄 msg-abc123/
        ├── 📄 user789/
        │   ├── "username": "jane"
        │   └── "deliveredAt": "2024-03-15T10:31:00Z"
        │
        └── 📄 user012/
            ├── "username": "bob"
            └── "deliveredAt": "2024-03-15T10:31:05Z"
```

## Firestore Structure (Cloud Firestore)

```
💾 Firestore Database
│
├── 📦 channels (Collection)
│   ├── 📄 general (Document)
│   │   ├── "id": "general"
│   │   ├── "name": "general"
│   │   ├── "description": "Public server-wide discussions"
│   │   ├── "creatorId": "system"
│   │   ├── "participantUids": []
│   │   ├── "createdAt": Timestamp(2024-03-15)
│   │   └── "updatedAt": Timestamp(2024-03-15)
│   │
│   ├── 📄 introductions (Document)
│   │   ├── "id": "introductions"
│   │   ├── "name": "introductions"
│   │   ├── "description": "Introduce yourself to the community"
│   │   ├── "creatorId": "system"
│   │   ├── "participantUids": []
│   │   ├── "createdAt": Timestamp(2024-03-15)
│   │   └── "updatedAt": Timestamp(2024-03-15)
│   │
│   └── 📄 dev-random-channel (Document)
│       └── ... (user-created channels)
│
└── 📦 channelHistory (Collection)
    ├── 📄 general (Document - subcollection root)
    │   └── 📦 days (Subcollection)
    │       ├── 📄 2024-03-15 (Document)
    │       │   ├── "dateKey": "2024-03-15"
    │       │   ├── "channelId": "general"
    │       │   └── "messages": [
    │       │       {
    │       │         "id": "msg-abc123",
    │       │         "channelId": "general",
    │       │         "senderUid": "user456",
    │       │         "senderUsername": "john_doe",
    │       │         "text": "Hello everyone!",
    │       │         "timestamp": "2024-03-15T10:30:00Z",
    │       │         "dateKey": "2024-03-15",
    │       │         "recipients": ["user789", "user012"],
    │       │         "edited": false,
    │       │         "deleted": false,
    │       │         "isPing": false,
    │       │         "replyToMessageId": null
    │       │       },
    │       │       { ... more messages for this day ... }
    │       │     ]
    │       │
    │       ├── 📄 2024-03-14 (Document)
    │       │   ├── "dateKey": "2024-03-14"
    │       │   ├── "channelId": "general"
    │       │   └── "messages": [ ... historical messages ... ]
    │       │
    │       └── 📄 2024-03-13 (Document)
    │           └── ... (older messages)
    │
    ├── 📄 introductions (Document)
    │   └── 📦 days (Subcollection)
    │       ├── 📄 2024-03-15
    │       │   └── "messages": [ ... ]
    │       └── ...
    │
    └── 📄 other-channels (Document)
        └── ... (other channel histories)
```

## Message Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ MESSAGE LIFECYCLE                                               │
└─────────────────────────────────────────────────────────────────┘

STATE 1: CREATION (Client)
┌────────────────────────────────────────┐
│ User clicks send                       │
│ ✓ ID: "local-123" (optimistic)       │
│ ✓ pending: true                       │
│ ✓ UI: "Sending..."                   │
└────────────────────────────────────────┘
           │
           ▼
STATE 2: QUEUED (RTDB)
┌────────────────────────────────────────┐
│ queues/server/msg-abc123              │
│ ✓ ID: "msg-abc123" (confirmed)       │
│ ✓ timestamp: "2024-03-15T10:30:00Z"  │
│ ✓ recipients: [user789, user012]     │
│ ✓ Waiting for Cloud Function          │
└────────────────────────────────────────┘
           │
           ▼
STATE 3: IN INBOX (RTDB - Real-time)
┌────────────────────────────────────────┐
│ inboxes/user789/msg-abc123            │
│ inboxes/user012/msg-abc123            │
│ ✓ Recipients see unread message       │
│ ✓ Subscriptions trigger on client     │
│ ✓ showMessageNode(message)            │
└────────────────────────────────────────┘
           │
           ▼
STATE 4: ACKNOWLEDGED (RTDB)
┌────────────────────────────────────────┐
│ acknowledgeInboxMessage()              │
│ ✓ inboxes/user789/msg-abc123 → DELETE │
│ ✓ deliveryReceipts/msg-abc123/user789 │
│   {username: "jane", deliveredAt: ...}│
└────────────────────────────────────────┘
           │
           ▼
STATE 5: ARCHIVED (Firestore)
┌────────────────────────────────────────┐
│ Cloud Function processes:              │
│ channelHistory/general/days/           │
│   2024-03-15/messages[] ← APPEND       │
│ queues/server/msg-abc123 ← DELETE      │
│ ✓ Message now in Firestore history     │
└────────────────────────────────────────┘
           │
           ▼
STATE 6: DELIVERY COMPLETE (Status)
┌────────────────────────────────────────┐
│ Delivery Receipts                      │
│ ✓ deliveryReceipts/msg-abc123/user789 │
│ ✓ deliveryReceipts/msg-abc123/user012 │
│ ✓ UI: "✓ Delivered (2/2)"            │
│   Showing: jane, bob                   │
│ ✓ Available for message history query  │
└────────────────────────────────────────┘

⏱️  Timeline:
   T+0ms    Message sent
   T+50ms   In RTDB queue
   T+100ms  In recipients' inboxes
   T+200ms  Users acknowledge receipt
   T+300ms  Cloud Function archives to Firestore
   T+400ms  Message appears in "Load Previous Day"
```

## Read Path - Loading Messages for a Day

```
┌──────────────────────────────────────────┐
│ 1. USER CLICKS CHANNEL                   │
│    await selectChannel("general")        │
└──────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│ 2. LOAD TODAY'S MESSAGES                 │
│    await preloadTodayMessages()          │
│    For each channel:                     │
│    ├─ getTodayDateKey() → "2024-03-15"  │
│    └─ loadMessagesForDay(id, dateKey)   │
└──────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│ 3. QUERY FIRESTORE                       │
│    READ channelHistory/general/days/     │
│      2024-03-15                          │
│    Returns: messages[] array (today)     │
└──────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│ 4. RENDER MESSAGES                       │
│    forEach message in messages[]         │
│    ├─ createMessageNode(message)        │
│    ├─ append to DOM                     │
│    └─ scroll to bottom                  │
└──────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│ 5. SUBSCRIBE TO LIVE UPDATES             │
│    subscribeToInbox(uid)                 │
│    ├─ Watch inboxes/{uid}               │
│    ├─ onChildAdded → new message        │
│    └─ Update delivery receipts           │
└──────────────────────────────────────────┘
```

## Scaling Considerations

```
┌─────────────────────────────────────────────────────┐
│ CURRENT LIMITS (100s of users)                     │
├─────────────────────────────────────────────────────┤
│ Messages/day:  ~1,000 per channel                  │
│ Concurrent:    ~100 users                          │
│ Storage:       ~10 MB (Firestore)                  │
│ RTDB Size:     ~1 MB (live data only)             │
│ Cost:          ~$1-5/month                         │
└─────────────────────────────────────────────────────┘
                       │
                       ▼ (growth)
┌─────────────────────────────────────────────────────┐
│ OPTIMIZE AT 1000+ USERS                            │
├─────────────────────────────────────────────────────┤
│ ✓ Add Firestore indexes                           │
│ ✓ Implement message pagination                     │
│ ✓ Archive to Cloud Storage (old messages)         │
│ ✓ Use pub/sub instead of inbox push              │
│ ✓ Implement channel subscriptions                 │
│ ✓ Split into sharded queues (queues/ch1, ch2..)  │
└─────────────────────────────────────────────────────┘
```

---

For detailed structure info, see [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)
For setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
For security rules, see [FIREBASE_RULES.md](FIREBASE_RULES.md)
