# SPS - A Discord-Inspired Messaging App

A modern, real-time messaging application built with **Vite**, **Firebase**, and **PWA technology** for iOS. SPS provides a secure, fast, and user-friendly messaging experience with a closed userbase accessed through Firebase Authentication.

## Features

✨ **Real-time Messaging** - Instant message delivery using Firebase Realtime Database  
🔐 **Firebase Authentication** - Secure email/password authentication  
📱 **Progressive Web App** - Works as a native app on iOS via PWA  
🎨 **Discord-Inspired UI** - Clean, modern interface with dark theme  
📞 **Push Notifications** - Real-time notifications on iOS  
⚡ **Fast & Responsive** - Built with Vite for optimal performance  
🪝 **Service Worker** - Offline support and caching  

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase project with Realtime Database enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/SPSOfficial.git
   cd SPSOfficial
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or select an existing one
   - Enable Firebase Authentication (Email/Password)
   - Create a Realtime Database
   - Copy your project configuration
   - Update `src/config.js` with your Firebase credentials:

   ```javascript
   export const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "your-project.firebaseapp.com",
       databaseURL: "https://your-project-default-rtdb.firebaseio.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_ID",
       appId: "YOUR_APP_ID"
   };
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

### Firebase Database Rules

Set up these Realtime Database rules for security:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child($uid).child('public').val() === true",
        ".write": "$uid === auth.uid",
        "uid": {
          ".validate": "newData.val() === $uid"
        }
      }
    },
    "channels": {
      "$channelId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "messages": {
          "$messageId": {
            ".read": "auth != null",
            ".write": "newData.child('userId').val() === auth.uid && newData.hasChildren(['userId', 'username', 'text', 'timestamp'])",
            "userId": {
              ".validate": "newData.val() === auth.uid"
            }
          }
        }
      }
    }
  }
}
```

## Project Structure

```
SPSOfficial/
├── src/
│   ├── main.js           # App entry point
│   ├── config.js         # Firebase configuration
│   ├── firebase.js       # Firebase integration & API
│   ├── auth.js          # Authentication UI & logic
│   └── messaging.js     # Messaging UI & logic
├── public/
│   ├── styles/
│   │   ├── global.css    # Global styles
│   │   ├── auth.css      # Authentication styles
│   │   └── messaging.css # Messaging UI styles
│   ├── icons/            # PWA icons (192x192, 512x512)
│   ├── manifest.json     # PWA manifest
│   └── screenshots/      # PWA screenshots
├── index.html            # Main entry point
├── sw.js                 # Service Worker
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md
```

## iOS PWA Setup

To install as a PWA on iOS:

1. Open the app URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Name the app and confirm

### PWA Icons

Add the following icon files to `public/icons/`:

- `192.png` - 192x192 pixels (standard icon)
- `512.png` - 512x512 pixels (splash screen)
- `maskable-192.png` - 192x192 pixels (adaptive icon)
- `maskable-512.png` - 512x512 pixels (adaptive icon)

You can generate these icons using [PWA Builder Icon Generator](https://www.pwabuilder.com/).

## Development

### Available Scripts

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production
npm run preview   # Preview production build
npm run deploy    # Build and deploy to GitHub Pages
```

## Architecture

### Authentication Flow

1. User signs up with email/password
2. Firebase creates user and stores profile in database
3. Session maintained via Firebase Auth state
4. User logged out clears all data

### Messaging Flow

1. User selects a channel
2. Messages are loaded from Firebase Realtime Database
3. Service Worker listens for new messages
4. Messages are displayed in real-time
5. User types and sends messages which update the database

### Data Structure

```
/users/{uid}
  - email
  - username
  - createdAt
  - lastSeen

/channels/{channelId}
  - name
  - description
  - createdAt
  - /messages/{messageId}
    - id
    - userId
    - username
    - text
    - timestamp
    - edited
```

## Design Specifications

### Color Scheme

- **Primary**: `#7c3aed` (Purple)
- **Secondary**: `#6d28d9` (Dark Purple)
- **Background**: `#0f0f0f` (Almost Black)
- **Surface**: `#1f1f1f` (Dark Gray)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#b0b0b0` (Light Gray)

### Responsive Design

- **Desktop**: Full sidebar with channels list
- **Tablet**: Adjusted sidebar width
- **Mobile**: Horizontal scrolling channel list, optimized touch targets

## Performance Optimizations

- Vite for fast module bundling
- Service Worker for offline caching
- Firebase Realtime Database for instant updates
- Lazy loading of messages
- Optimized CSS with minimal reflows

## Security Notes

- All data is encrypted in transit via Firebase SSL
- Database rules enforce user authentication
- Users can only modify their own data
- Consider enabling Firebase App Check in production

## Troubleshooting

### Firebase Config Not Loading
- Ensure `src/config.js` is updated with correct credentials
- Check Firebase project settings in console
- Verify database URL is correct

### Messages Not Appearing
- Check Firebase database rules
- Ensure channel exists in database
- Verify network connection
- Check browser console for errors

### PWA Not Installing
- Ensure HTTPS is used (required for PWA)
- Check manifest.json is accessible
- Verify service worker is registered
- Use PWA Builder to validate

## Deployment

### GitHub Pages

1. Update `vite.config.js` base path if needed:
   ```javascript
   export default {
     base: '/SPSOfficial/'
   }
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

### Other Hosting

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload `dist/` folder to your hosting service

3. Ensure HTTPS is enabled for PWA to work

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - Feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Check existing issues on GitHub
- Create a new issue with detailed description
- Include browser/device information
- Attach screenshots if relevant

---

**Happy messaging! 💬**
