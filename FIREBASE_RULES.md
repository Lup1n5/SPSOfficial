# Firebase Database Rules for SPS

This file contains security rules for both **Firebase Realtime Database** and **Firestore**.

## Important Security Notes

- ⚠️ Replace these rules **before deploying to production**
- 🔐 These rules enforce authentication and data ownership
- 📋 Users can only read/write their own data and public channels
- 🛡️ Messages can only be written by the authenticated user
- 👉 Deploy Realtime Database rules separately from Firestore rules

## Complete Rules - Realtime Database

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    ".indexOn": ["timestamp", "userId"],
    
    "users": {
      "$uid": {
        ".read": "auth.uid !== null",
        ".write": "$uid === auth.uid",
        ".validate": "newData.child('uid').val() === $uid",
        
        "uid": {
          ".validate": "newData.val() === auth.uid"
        },
        "email": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "username": {
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 30"
        },
        "createdAt": {
          ".validate": "newData.isString()"
        },
        "lastSeen": {
          ".validate": "newData.isString()"
        }
      }
    },
    
    "channels": {
      "$channelId": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || root.child('channels').child($channelId).child('creatorId').val() === auth.uid)",
        ".validate": "newData.hasChildren(['name'])",
        
        "name": {
          ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 32"
        },
        "description": {
          ".validate": "newData.isString() || !newData.exists()"
        },
        "createdAt": {
          ".validate": "newData.isString()"
        },
        "creatorId": {
          ".validate": "newData.val() === auth.uid"
        },
        
        "messages": {
          "$messageId": {
            ".read": "auth != null",
            ".write": "newData.child('userId').val() === auth.uid && !data.exists()",
            ".validate": "newData.hasChildren(['userId', 'username', 'text', 'timestamp']) && newData.child('userId').val() === auth.uid",
            
            "id": {
              ".validate": "newData.val() === $messageId"
            },
            "userId": {
              ".validate": "newData.val() === auth.uid"
            },
            "username": {
              ".validate": "newData.isString() && newData.val().length > 0"
            },
            "text": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 2000"
            },
            "timestamp": {
              ".validate": "newData.isString()"
            },
            "edited": {
              ".validate": "newData.isBoolean() || !newData.exists()"
            }
          }
        }
      }
    },
    
    "userChannels": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        
        "$channelId": {
          ".validate": "newData.isBoolean()"
        }
      }
    },
    
    "typing": {
      "$channelId": {
        ".read": "auth != null",
        ".write": "auth != null",
        
        "$uid": {
          ".write": "auth.uid === $uid",
          "isTyping": {
            ".validate": "newData.isBoolean()"
          },
          "timestamp": {
            ".validate": "newData.isNumber()"
          }
        }
      }
    }
  }
}
```

## Rule Breakdown

### Root Rules
```json
".read": false,    // Deny all reads by default
".write": false    // Deny all writes by default
```
Default deny strategy ensures security.

### Users Structure
```json
"/users/{uid}"
```
- **Read:**users can only read any profile
- **Write:** Only the user can write to their own profile
- **Validation:** Ensures user ID matches UID

### Channels Structure
```json
"/channels/{channelId}"
```
- **Read:** Must be authenticated
- **Write:** Can create/update channels (first write only, no overwrite)
- **Messages:** Append-only, user can only write their own messages
- **Validation:** Message must include required fields

### User Channels Structure
```json
"/userChannels/{uid}/{channelId}"
```
Tracks which channels a user has joined/muted.

### Typing Indicator Structure
```json
"/typing/{channelId}/{uid}"
```
Real-time typing indicators (optional feature).

## Testing Rules

### Test in Firebase Console

1. Go to **Realtime Database** > **Rules**
2. Paste the rules above
3. Review warnings (should be none)
4. Click **Publish**

### Test Cases

Create a test user and verify:

```javascript
// Should succeed (authenticated user writing own data)
set(ref(db, 'users/' + auth.uid), {
  uid: auth.uid,
  username: 'testuser',
  email: 'test@example.com'
})

// Should fail (trying to write as different user)
set(ref(db, 'users/different_uid'), {...})

// Should succeed (writing message to channel)
push(ref(db, 'channels/general/messages'), {
  userId: auth.uid,
  username: 'testuser',
  text: 'Hello world',
  timestamp: new Date().toISOString()
})

// Should fail (writing message without userId)
push(ref(db, 'channels/general/messages'), {
  text: 'Hello world'
})
```

## Production Considerations

### Enhancements for Scale

```json
{
  "rules": {
    ".indexOn": ["timestamp", "userId", "createdAt"],
    
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        
        "stats": {
          ".read": "$uid === auth.uid"
        }
      }
    },
    
    "channels": {
      "$channelId": {
        ".read": "auth != null",
        ".write": "auth != null",
        
        "members": {
          "$memberId": {
            ".write": "root.child('channels').child($channelId).child('members').child(auth.uid).exists()"
          }
        }
      }
    }
  }
}
```

### Rate Limiting

For production, consider:
1. Firebase Security Rules rate limiting
2. Cloud Functions for message rate limiting
3. Firestore instead of Realtime Database for better control

## Common Issues

### "Permission Denied"

**Cause:** User not authenticated or rule doesn't allow access

**Solution:**
1. Verify user is logged in
2. Check authentication token
3. Review rule permissions

### "Validation Error"

**Cause:** Data doesn't match validation rules

**Solution:**
1. Check all required fields are present
2. Verify data types (string, number, boolean)
3. Check string length limits

### Performance Issues

**Cause:** Rules too complex or missing indexes

**Solution:**
1. Add `.indexOn` for frequently queried fields
2. Simplify rule logic
3. Use Firebase Performance Monitoring
4. Consider migrating to Firestore

## Migration to Firestore (Advanced)

For a more scalable solution, migrate to Firestore:

```javascript
// Firestore equivalent
const db = getFirestore(app);
const usersCollection = collection(db, 'users');
const channelsCollection = collection(db, 'channels');
```

Firestore offers:
- Better scalability
- Richer query capabilities
- Cloud Functions integration
- More granular security rules

---

## Complete Rules - Firestore

Deploy these rules to your **Firestore Database** in Firebase Console:
**Path:** Firestore Database > Rules > Copy & Paste below > Publish

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny strategy
    match /{document=**} {
      allow read, write: false;
    }

    // Channels collection - Public read, authenticated write
    match /channels/{channelId} {
      allow read: if request.auth != null;
      
      // Only creator can write/update/delete
      allow write: if request.auth != null && (
        !exists(/databases/$(database)/documents/channels/$(channelId)) ||
        resource.data.creatorId == request.auth.uid
      );
      
      // Validate channel document structure
      allow create: if request.auth != null && 
        request.resource.data.keys().hasAll(['name']) &&
        request.resource.data.name is string &&
        request.resource.data.name.size() >= 1 &&
        request.resource.data.name.size() <= 32 &&
        (request.resource.data.description is string || 
         !'description' in request.resource.data) &&
        request.resource.data.creatorId == request.auth.uid &&
        (request.resource.data.participantUids is list || 
         !'participantUids' in request.resource.data) &&
        request.resource.data.createdAt is timestamp &&
        request.resource.data.updatedAt is timestamp;
      
      // Allow updates to metadata only
      allow update: if request.auth != null &&
        resource.data.creatorId == request.auth.uid &&
        (request.resource.data.description is string ||
         !'description' in request.resource.data) &&
        request.resource.data.updatedAt is timestamp;
    }

    // Channel history - Message archive (read-only from client)
    match /channelHistory/{channelId}/days/{dateKey} {
      allow read: if request.auth != null;
      allow write: if false;  // Only Cloud Functions can write
      
      // Validate message array structure
      allow create: if false;  // Cloud Functions only
      allow update: if false;  // Cloud Functions only
    }

    // Delivery receipts - Track message delivery
    match /deliveryReceipts/{messageId}/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid && (
        request.resource.data.keys().hasAll(['username', 'deliveredAt']) &&
        request.resource.data.username is string &&
        request.resource.data.deliveredAt is timestamp
      );
    }

    // Optional: User profiles in Firestore (alternative to RTDB)
    // Uncomment if you migrate user data to Firestore
    /*
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
      
      // Validate user document
      allow create: if request.auth.uid == uid &&
        request.resource.data.keys().hasAll(['uid', 'email', 'username']) &&
        request.resource.data.uid == uid &&
        request.resource.data.username is string &&
        request.resource.data.username.size() >= 3 &&
        request.resource.data.username.size() <= 30 &&
        request.resource.data.email is string &&
        request.resource.data.createdAt is timestamp;
      
      allow update: if request.auth.uid == uid &&
        (request.resource.data.username is string &&
         request.resource.data.username.size() >= 3 &&
         request.resource.data.username.size() <= 30 ||
         !'username' in request.resource.data);
    }
    */
  }
}
```

## Firestore Rule Breakdown

### Channels Collection
```
/channels/{channelId}
```
- **Read:** Authenticated users can list and read all channels
- **Create:** Authenticated users can create channels
- **Update:** Only the channel creator can modify
- **Delete:** Only the channel creator can delete
- **Validation:** `name` required (1-32 chars), `creatorId` must match authenticated user

### Channel History Collection
```
/channelHistory/{channelId}/days/{dateKey}
```
- **Read:** Authenticated users can read message archives
- **Write:** Blocked from client (Cloud Functions only)
- **Purpose:** Long-term message storage, read via `getMessagesForDay()`

### Delivery Receipts Collection
```
/deliveryReceipts/{messageId}/{uid}
```
- **Read:** Authenticated users can check delivery status
- **Write:** Users can only write their own delivery receipts
- **Contains:** `username` (string), `deliveredAt` (timestamp)

## Testing Firestore Rules

### 1. Test in Firebase Console

1. Go to **Firestore Database** > **Rules** tab
2. Copy & paste rules above
3. Click **Publish**
4. Go to **Rules** > **Simulator** tab
5. Create test cases below

### 2. Test Cases

```javascript
// Test: Authenticated user can read channels
Request: get /channels/general
Auth: { uid: "user123" }
Expected: ✅ ALLOW

// Test: Unauthenticated user cannot read
Request: get /channels/general
Auth: null
Expected: ❌ DENY

// Test: Authenticated user can create channel
Request: create /channels/newchannel
Auth: { uid: "user123" }
Data: {
  name: "newchannel",
  creatorId: "user123",
  description: "Test channel",
  participantUids: [],
  createdAt: now,
  updatedAt: now
}
Expected: ✅ ALLOW

// Test: User cannot create with mismatched creatorId
Request: create /channels/newchannel
Auth: { uid: "user123" }
Data: {
  name: "newchannel",
  creatorId: "user456",  // Different from auth.uid
  ...
}
Expected: ❌ DENY

// Test: Non-creator cannot update channel
Request: update /channels/general
Auth: { uid: "user123" }
Data: { description: "Updated" }
Existing: { creatorId: "user456" }
Expected: ❌ DENY

// Test: Message archive is read-only
Request: create /channelHistory/general/days/2024-03-15
Auth: { uid: "user123" }
Expected: ❌ DENY (Cloud Functions only)

// Test: User can write own delivery receipt
Request: set /deliveryReceipts/msg123/user123
Auth: { uid: "user123" }
Data: {
  username: "john_doe",
  deliveredAt: now
}
Expected: ✅ ALLOW

// Test: User cannot write others' delivery receipt
Request: set /deliveryReceipts/msg123/user456
Auth: { uid: "user123" }
Expected: ❌ DENY
```

## Firestore Security Best Practices

### 1. Development Mode (⚠️ DO NOT USE IN PRODUCTION)
```javascript
// ONLY FOR LOCAL DEVELOPMENT
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Production Mode (USE THESE)
- Use rules above
- Enable billing (required for > 50k operations/day)
- Set up firewall rules to limit access by IP
- Monitor quota usage in Firebase Console

### 3. Composite Indexes
For better query performance, create indexes:

**Go to:** Firestore Database > Indexes

Index 1 - By creation date:
- Collection: `channels`
- Fields: `createdAt` (Descending)

Index 2 - By creator:
- Collection: `channels`
- Fields: `creatorId` (Ascending), `createdAt` (Descending)

## Migrating Rules Between Environments

### Deploy to Production from CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select project
firebase use --add

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy RTDB rules
firebase deploy --only database
```

### Version Control Your Rules

`firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "database": {
    "rules": "database.rules.json"
  }
}
```

Then commit rules to git:
```bash
git add firestore.rules database.rules.json
git commit -m "Update Firebase security rules"
```

## Additional Resources

- [Firestore Security Documentation](https://firebase.google.com/docs/firestore/security/start)
- [RTDB Security Documentation](https://firebase.google.com/docs/rules)
- [Security Rules Simulator](https://firebase.google.com/docs/rules/simulator)
- [Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [Quotas and Limits](https://firebase.google.com/docs/firestore/quotas)

---

For help or questions about these rules, refer to the DATABASE_STRUCTURE.md or open an issue.
