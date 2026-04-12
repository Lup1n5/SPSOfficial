# SPS Setup Instructions

## ⚡ Quick Start (Choose One)

### Option 1: Guided Setup (Recommended)
```bash
# Windows
setup.bat

# macOS/Linux
bash setup.sh
```
Then follow the prompts in [QUICKSTART.md](QUICKSTART.md)

### Option 2: Manual Setup
```bash
npm install
npm run dev
```

## 🔧 Configure Firebase (Required)

1. **Create Firebase Project** → https://console.firebase.google.com
2. **Enable Services:**
   - Authentication (Email/Password)
   - Realtime Database
3. **Get Credentials:**
   - Project Settings → General tab
   - Copy: API Key, Auth Domain, Database URL, Project ID, etc.
4. **Apply to Your Project:**
   - Edit `src/config.js`
   - OR edit `.env.local` (recommended)
5. **Set Database Rules:**
   - Copy from `FIREBASE_RULES.md`
   - Paste into Database → Rules → Publish

## 📚 Documentation Guide

| Document | Read When | Purpose |
|----------|-----------|---------|
| **[QUICKSTART.md](QUICKSTART.md)** | First | 5-minute setup walkthrough |
| **[README.md](README.md)** | Planning | Full feature documentation |
| **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** | Understanding | What was built and why |
| **[PWA_SETUP.md](PWA_SETUP.md)** | iOS questions | Progressive Web App features |
| **[FIREBASE_RULES.md](FIREBASE_RULES.md)** | Database setup | Security rules |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Going live | Deploy to GitHub Pages |

## 🎯 First 5 Steps

1. **Install**
   ```bash
   npm install
   ```

2. **Configure**
   - Update `src/config.js` with Firebase credentials

3. **Enable Database Rules**
   - Copy rules from `FIREBASE_RULES.md` to Firebase Console

4. **Start Dev Server**
   ```bash
   npm run dev
   ```

5. **Test**
   - Sign up with test email
   - Send a message
   - See it appear in real-time!

## 🚀 Common Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview built app
npm run deploy     # Deploy to GitHub Pages
```

## 🎨 Project Structure at a Glance

```
src/              ← Your application code
├── main.js       ← Entry point
├── firebase.js   ← Database operations
├── auth.js       ← Login/signup UI
└── messaging.js  ← Chat interface

public/           ← Static assets
├── styles/       ← CSS files
├── icons/        ← Add PWA icons here
└── manifest.json ← PWA configuration
```

## 🔐 Security Checklist

- [ ] Created Firebase project
- [ ] Enabled Authentication (Email/Password)
- [ ] Created Realtime Database
- [ ] Applied database rules from `FIREBASE_RULES.md`
- [ ] Updated `src/config.js` with credentials
- [ ] Never committed .env.local to Git

## 📱 iOS Installation

Once deployed:
1. Open in Safari
2. Tap Share → "Add to Home Screen"
3. Name the app
4. Tap Add

See [PWA_SETUP.md](PWA_SETUP.md) for details.

## 🆘 Need Help?

- **Setup issues?** → Read [QUICKSTART.md](QUICKSTART.md)
- **Feature questions?** → Check [README.md](README.md)
- **PWA problems?** → See [PWA_SETUP.md](PWA_SETUP.md)
- **Deployment?** → Read [DEPLOYMENT.md](DEPLOYMENT.md)
- **Database?** → Review [FIREBASE_RULES.md](FIREBASE_RULES.md)

---

**Start with**: `npm install` then read [QUICKSTART.md](QUICKSTART.md)

**Questions?** Check the relevant documentation above.
