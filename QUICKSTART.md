# Quick Start Guide - SPS

Get up and running with SPS in 5 minutes!

## Step 1: Clone & Install (2 min)

```bash
# Clone the repository
git clone https://github.com/yourusername/SPSOfficial.git
cd SPSOfficial

# Run setup script
# Windows:
setup.bat

# macOS/Linux:
bash setup.sh

# Or manually:
npm install
```

## Step 2: Configure Firebase (2 min)

### Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "SPS" (or your preferred name)
4. Create the project
5. In **Project Settings** (gear icon), copy these values:

```
API Key
Auth Domain
Database URL  ← Important!
Project ID
Storage Bucket
Messaging Sender ID
App ID
```

### Apply to Your Project

**Option A: Direct Configuration**

Update `src/config.js`:
```javascript
export const firebaseConfig = {
    apiKey: "AIzaSyDbR...",
    authDomain: "sps-project.firebaseapp.com",
    databaseURL: "https://sps-project-default-rtdb.firebaseio.com",
    projectId: "sps-project",
    storageBucket: "sps-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

**Option B: Environment Variables**

1. Update `.env.local`:
```env
VITE_FIREBASE_API_KEY=AIzaSyDbR...
VITE_FIREBASE_AUTH_DOMAIN=sps-project.firebaseapp.com
...
```

2. Update `src/config.js`:
```javascript
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    ...
};
```

## Step 3: Enable Firebase Features (1 min)

### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password**
4. Save

### Enable Realtime Database

1. Go to **Realtime Database**
2. Click **Create Database**
3. Start in **test mode**
4. Choose region (closest to your users)
5. Copy the Database URL to your config

### Set Security Rules

1. Click on the **Rules** tab
2. Replace with rules from `FIREBASE_RULES.md`
3. Click **Publish**

## Step 4: Add Icons (Optional)

Add PWA icons to `public/icons/`:
- `192.png` (192×192)
- `512.png` (512×512)

See `PWA_SETUP.md` for icon generation tools.

## Step 5: Start Development! (1 min)

```bash
npm run dev
```

This opens `http://localhost:3000` in your browser automatically.

## First Test

1. **Create Account:**
   - Click "Sign Up"
   - Enter email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
   - Confirm password

2. **Send Messages:**
   - Type message in input field
   - Press Enter or click send
   - See message appear in real-time!

3. **Test Real-time:**
   - Open in two browser tabs
   - Send message from one tab
   - Watch it appear in the other

## Common Issues

### "Firebase initialization error: Missing or invalid API key"
- Check your Firebase credentials in config.js
- Verify database URL starts with `https://`

### Messages not saving
- Go to Firebase Console > Database > Rules
- Copy rules from `FIREBASE_RULES.md` and Publish

### PWA not installing
- App works without PWA features initially
- See `PWA_SETUP.md` for details

## Next Steps

### Deploy to GitHub Pages

```bash
npm run build
npm run deploy
```

Then enable GitHub Pages in your repository settings.

### Customize the Appearance

Edit colors in `public/styles/global.css`:
```css
:root {
    --primary: #7c3aed;      /* Main color */
    --background: #0f0f0f;   /* App background */
    --surface: #1f1f1f;      /* Cards/panels */
}
```

### Add More Channels

1. Click `+` button next to "Channels"
2. Enter channel name and description
3. It saves to Firebase automatically

### Enable Push Notifications

See `PWA_SETUP.md` section on "Push Notifications".

## Project Structure

```
SPSOfficial/
├── src/
│   ├── main.js          ← App startup
│   ├── config.js        ← Firebase settings
│   ├── firebase.js      ← Database functions
│   ├── auth.js          ← Login/signup UI
│   └── messaging.js     ← Chat interface
├── public/
│   ├── styles/          ← CSS files
│   ├── icons/           ← PWA icons (add here)
│   └── manifest.json    ← PWA settings
├── index.html           ← Main page
├── sw.js                ← Offline support
└── vite.config.js       ← Build settings
```

## Development Tips

### Hot Reload
Changes to files automatically reload in browser (no refresh needed).

### Console Debugging
Open browser DevTools (F12) > Console to see errors.

### Check Firebase
Open Firebase Console to see:
- Users created
- Messages stored
- Database structure
- Authentication logs

## Useful Links

| Link | Purpose |
|------|---------|
| [Firebase Console](https://console.firebase.google.com) | Manage your Firebase project |
| [Vite Docs](https://vitejs.dev) | Learn about the build tool |
| [Firebase Docs](https://firebase.google.com/docs) | Firebase reference |
| [PWA Docs](https://web.dev/progressive-web-apps/) | Learn about PWAs |

## Getting Help

1. Check [README.md](README.md) for detailed docs
2. See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
3. Read [PWA_SETUP.md](PWA_SETUP.md) for PWA features
4. Check [FIREBASE_RULES.md](FIREBASE_RULES.md) for database rules
5. Open an issue on GitHub with error messages

---

**You're all set! Start developing with `npm run dev` 🚀**
