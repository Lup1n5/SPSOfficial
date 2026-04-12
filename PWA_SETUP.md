# PWA Setup Guide for SPS

This guide helps you set up and optimize the Progressive Web App (PWA) for iOS and other platforms.

## What is a PWA?

A Progressive Web App is a web application that uses modern web capabilities to deliver an app-like experience. PWAs can:
- Work offline or on slow networks
- Be installed on home screens
- Send push notifications
- Access device hardware
- Update automatically

## iOS PWA Installation

### Method 1: Direct Installation (iOS 16.4+)

1. **Open Safari** and navigate to your SPS instance
2. **Tap the Share button** (bottom right)
3. **Tap "Add to Home Screen"**
4. **Enter the app name** (default: "SPS")
5. **Tap "Add"**

The app will now appear on your home screen and open in fullscreen mode.

### Method 2: Bookmark with Shortcut

For iOS 15 and earlier versions, create a shortcut:

1. Open Shortcuts app
2. Create new shortcut
3. Add "Open URL" action
4. Enter your SPS URL
5. Add to home screen

## PWA Icons Setup

PWA icons need to be placed in `public/icons/` with specific sizes:

### Required Icon Files

- **192.png** - Standard icon (192x192 px)
- **512.png** - Large icon for splash screens (512x512 px)
- **maskable-192.png** - Adaptive icon for iOS (192x192 px with safe zone)
- **maskable-512.png** - Adaptive icon for splash (512x512 px with safe zone)

### Generating Icons

1. **Using PWA Builder:**
   - Go to [pwabuilder.com](https://www.pwabuilder.com/)
   - Enter your app URL
   - Download generated icons

2. **Using Figma:**
   - Design a 512x512 design
   - Export as PNG
   - Create variants at 192x192

3. **Using Online Tools:**
   - [Icon Generator](https://www.favicon-generator.org/)
   - [PWA Assets Generator](https://tomayac.github.io/pwa-asset-generator/)

### iOS Icon Guidelines

For iOS PWA icons:
- Use solid colors without transparency
- Keep important elements in the center (safe zone)
- Use square format (not rounded)
- Provide both maskable and standard versions

## Manifest.json Configuration

The `public/manifest.json` is already configured with:

```json
{
  "name": "SPS - Messaging",
  "short_name": "SPS",
  "description": "A Discord-inspired messaging application",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#7c3aed",
  "background_color": "#0f0f0f"
}
```

### Customization Options

```javascript
{
  // Display Mode
  "display": "standalone"     // Full app experience
  // Alternatives: "fullscreen", "minimal-ui", "browser"

  // Orientation
  "orientation": "portrait-primary"  // Force portrait on iOS
  // Alternatives: "landscape", "any"

  // Colors
  "theme_color": "#7c3aed"           // Address bar color
  "background_color": "#0f0f0f"      // Splash screen background

  // App Start
  "start_url": "/?utm_source=pwa"    // Track PWA launches
}
```

## Testing the PWA

### Chrome DevTools

1. **Open Developer Tools** (F12)
2. **Go to Application tab**
3. **Check Manifest** - Verify all fields
4. **Check Service Worker** - Ensure registered
5. **Test offline** - Disconnect network and refresh

### Lighthouse Audit

1. **Open DevTools > Lighthouse**
2. **Select "PWA"**
3. **Run audit**
4. **Fix issues** in the report

### PWA Validator

Use these tools to validate your PWA:
- [PWA Builder Quality Assessment](https://pwabuilder.com)
- [Web.dev Lighthouse](https://web.dev/measure/)

## Service Worker Updates

The Service Worker in `sw.js` handles:

### Caching Strategy

- **Static assets** (CSS, HTML, icons) are cached on install
- **API calls** are cached on first successful request
- **Old caches** are deleted on activate

### Update Flow

1. User visits app
2. Service Worker checks for new version
3. If new version found, downloads in background
4. Old cache is cleared on next visit
5. No user action needed

### Force Cache Update

Add a cache-busting parameter:
```html
<link rel="manifest" href="/manifest.json?v=2">
```

## Push Notifications (Firebase Cloud Messaging)

### Setup FCM

1. **In Firebase Console:**
   - Go to Project Settings
   - Copy Sender ID
   - Generate Web API Key

2. **Update config.js:**
   ```javascript
   // Add push notification setup
   const messaging = getMessaging(app);
   ```

3. **Request Permission:**
   ```javascript
   Notification.requestPermission().then(permission => {
     if (permission === 'granted') {
       // Get FCM token
       getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' })
     }
   });
   ```

## Device-Specific Considerations

### iOS PWA Limitations

✅ Works On:
- Home screen installation
- Offline browsing
- Push notifications (limited)
- Device storage access

❌ Limitations:
- No access to file system
- Limited background sync
- No deep linking to other apps
- No periodic background sync

### Android PWA Benefits

✅ Full Features:
- Google Play install
- Periodic background sync
- Better notification support
- More hardware access

### Windows/macOS PWA

✅ Features:
- Start menu integration
- App store distribution
- System integration

## Performance Optimization

### Image Optimization

```html
<!-- Use responsive images -->
<picture>
  <source media="(min-width: 512px)" srcset="image-512.png">
  <img src="image-192.png" alt="SPS Logo">
</picture>
```

### Code Splitting

Vite automatically handles:
- Module bundling
- Code splitting
- CSS extraction

### Cache Busting

The service worker automatically busts cache through:
- Version in CACHE_NAME
- Asset timestamps

## Security Considerations

### HTTPS Requirement

PWAs require HTTPS. Ensure:
- Your domain uses SSL certificate
- All resources load over HTTPS
- Redirects from HTTP to HTTPS

### Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

### Manifest Validation

Validate at least once per month:
```bash
curl https://yoursite.com/manifest.json
```

## Troubleshooting

### PWA Not Installing

**Problem:** "Add to Home Screen" not appearing

**Solutions:**
1. ✅ Ensure HTTPS is enabled
2. ✅ Check manifest.json is valid
3. ✅ Verify service worker registers
4. ✅ Check icons exist and 192x192 minimum
5. ✅ Try different Safari version

### Icons Not Showing

**Problem:** App shows blank icon on home screen

**Solutions:**
1. ✅ Icons must be PNG format
2. ✅ Icons must be at least 192x192 (recommend 512x512)
3. ✅ Check manifest.json paths
4. ✅ Clear browser cache
5. ✅ Reinstall app from home screen

### Service Worker Not Updating

**Problem:** Old cached version persists

**Solutions:**
1. ✅ Clear app cache: Settings > Safari > Advanced > Website Data
2. ✅ Remove app from home screen and reinstall
3. ✅ Increment CACHE_VERSION in sw.js
4. ✅ Wait up to 24 hours for update

### Notifications Not Appearing

**Problem:** Push notifications not working

**Solutions:**
1. ✅ Check notification permissions granted
2. ✅ Verify Firebase Cloud Messaging setup
3. ✅ Check browser console for errors
4. ✅ iOS may defer notifications while in foreground
5. ✅ Test with app in background

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Training](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://pwabuilder.com)
- [Can I Use PWA Features](https://caniuse.com)
- [Apple PWA Support](https://webkit.org/blog/14445/updates-to-web-apps-on-ios-and-ipados/)

---

Need help? Check the main README.md or open an issue on GitHub.
