# Firebase Database Rules for SPS

These are the recommended security rules for the Firebase Realtime Database used by SPS.

## Important Security Notes

- ⚠️ Replace these rules **before deploying to production**
- 🔐 These rules enforce authentication and data ownership
- 📋 Users can only read/write their own data and public channels
- 🛡️ Messages can only be written by the authenticated user

## Complete Rules

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    ".indexOn": ["timestamp", "userId"],
    
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || data.child('isPublic').val() === true",
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
- **Read:**users can only read their own profile or public profiles
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

## Additional Resources

- [Firebase Security Rules Docs](https://firebase.google.com/docs/rules)
- [Security Rules Simulator](https://firebase.google.com/docs/rules/simulator)
- [Best Practices](https://firebase.google.com/docs/rules/best-practices)

---

For help or questions about these rules, refer to the README.md or open an issue.
