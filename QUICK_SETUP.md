# Quick Setup Checklist

Quick reference for setting up SPS with Firebase and Firestore - complete in ~30 minutes.

## ✅ Pre-Setup (5 minutes)

- [ ] Have Google account ready
- [ ] Go to https://console.firebase.google.com
- [ ] Have this checklist open
- [ ] Have [FIREBASE_SETUP.md](FIREBASE_SETUP.md) open in another tab

## ✅ Firebase Project (5 minutes)

**Firebase Console > Create Project**

- [ ] Project Name: `sps-messaging` (or your choice)
- [ ] Analytics: Optional (recommend skip for development)
- [ ] Create Project
- [ ] Wait for notification "Your new Firebase project is ready"

**Register Web App**

- [ ] Click **Web** icon (</>)
- [ ] App Name: `sps-web`
- [ ] Skip "Set up Firebase Hosting"
- [ ] Register App
- [ ] **COPY the config object** → paste in `src/config.js`
- [ ] Next > See also... > Done

## ✅ Authentication (2 minutes)

**Firebase Console > Authentication**

- [ ] Click **Sign-in method** tab
- [ ] Click **Email/Password**
- [ ] Enable toggle ✓
- [ ] Save
- [ ] (Optional) Enable Google if desired

## ✅ Realtime Database (5 minutes)

**Firebase Console > Realtime Database**

- [ ] Click **Create Database**
- [ ] Location: Pick closest region (e.g. us-east1)
- [ ] Security rules: **Start in Test Mode** (for development)
- [ ] Enable
- [ ] Wait for creation (30 seconds)

**Deploy Rules:**

- [ ] Click **Rules** tab
- [ ] Copy rules from [FIREBASE_RULES.md](FIREBASE_RULES.md) section **"Complete Rules - Realtime Database"**
- [ ] Paste into editor
- [ ]**Publish**
- [ ] No syntax errors? = Success ✓

## ✅ Firestore Database (8 minutes)

**Firebase Console > Firestore Database**

- [ ] Click **Create Database**
- [ ] Security rules: **Start in Test Mode**
- [ ] Location: **Same as Realtime DB** (important!)
- [ ] Enable
- [ ] Wait for creation (2-3 minutes)

**Create channels Collection:**

- [ ] Click **Start collection**
- [ ] Collection ID: `channels`
- [ ] Next
- [ ] Document ID: `general`
- [ ] Auto ID: OFF
- [ ] Add fields:

```javascript
// Field 1
"id" (string)
"general"

// Field 2  
"name" (string)
"general"

// Field 3
"description" (string)
"Public channel for server-wide discussions"

// Field 4
"creatorId" (string)
"system"

// Field 5
"participantUids" (array)
(leave empty - no items)

// Field 6
"createdAt" (timestamp)
(current date)

// Field 7
"updatedAt" (timestamp)
(current date)
```

- [ ] Save

**Create introductions Channel:**

- [ ] Back to `channels` collection
- [ ] Click **Add document**
- [ ] Document ID: `introductions`
- [ ] Add same fields with updated values:
  - `id`: `introductions`
  - `name`: `introductions`
  - `description`: `Introduce yourself to the community`
  - `creatorId`: `system`
  - `participantUids`: (empty array)
  - `createdAt`: (current)
  - `updatedAt`: (current)
- [ ] Save

**Create channelHistory Collection (Empty):**

- [ ] Click **Start collection**
- [ ] Collection ID: `channelHistory`
- [ ] Next
- [ ] Document ID: `_placeholder`
- [ ] Add field: `placeholder` (boolean) = `true`
- [ ] Save
- [ ] Right-click `_placeholder` → Delete

**Deploy Firestore Rules:**

- [ ] Click **Rules** tab
- [ ] Copy rules from [FIREBASE_RULES.md](FIREBASE_RULES.md) section **"Complete Rules - Firestore"**
- [ ] Paste into editor
- [ ] **Publish**
- [ ] No syntax errors? = Success ✓

## ✅ Update App Config (2 minutes)

**Open `src/config.js`**

```javascript
export const firebaseConfig = {
  // REPLACE with your copied values from Firebase Console
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-id",
  appId: "your-app-id"
};
```

- [ ] Replace ALL values with your Firebase config
- [ ] Save file

## ✅ Verify Setup (5 minutes)

**Terminal:**

```bash
npm run dev
```

- [ ] Server starts at http://localhost:5173
- [ ] No error messages in terminal

**In Browser Console (F12 > Console):**

```javascript
// Check configs loaded
console.log(firebase);  // Should show Firebase SDK

// Test login
import('./src/firebase.js').then(m => {
  m.loginUser('test@example.com', 'test123456');
});
```

- [ ] See events in Firestore Console > Databases? = Good sign
- [ ] Login works? = Success ✓

**Firebase Console > Firestore > Data:**

- [ ] Can you see `channels` collection?
- [ ] Can you see `general` and `introductions` documents?
- [ ] Can you see the fields? = Success ✓

## ✅ Final Check (2 minutes)

**Browser > App**

- [ ] Register new account ✓
- [ ] Login works ✓
- [ ] See channels in sidebar ✓
- [ ] Can send message ✓

**Firebase Console > Realtime Database**

- [ ] After message sent, check:
  - [ ] `queues/server/` has message (temporary)
  - [ ] `inboxes/{otherUser}/` has message
  - [ ] `users/{yourUid}/` has your profile

**Firebase Console > Firestore**

- [ ] Check `channels` collection still has 2 channels

## 🎉 COMPLETE!

All setup done! 

### What's Next?

1. **Test with another account** - Create second browser profile to test messaging between users
2. **Monitor costs** - Go to Firebase > Project Settings > Usage & Billing
3. **Deploy to production** - When ready, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) Part 9

### Documentation

- 📖 **Detailed Database Structure:** [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)
- 📖 **Visual Architecture:** [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)
- 📖 **Full Setup Guide:** [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- 🔒 **Security Rules:** [FIREBASE_RULES.md](FIREBASE_RULES.md)

### Common First Issues

| Issue | Solution |
|-------|----------|
| "Cannot read channels" | Verify `channels` collection exists in Firestore |
| "Cannot send message" | Check RTDB has write access, verify rules deployed |
| "Permission denied" | Log out/in, clear cache, check rules deployed |
| "Empty channels list" | Add `general` and `introductions` documents |

### Get Help

1. Check browser console (F12) for errors
2. Check Firebase Console > Firestore > Rules > Simulator
3. Review [FIREBASE_SETUP.md](FIREBASE_SETUP.md) "Troubleshooting" section
4. Check repo README for support info

---

**Estimated Total Time:** 30-40 minutes
**Total Cost (first month):** $0 (Firebase has free tier)

Start at ✅ Pre-Setup, work through each section!
