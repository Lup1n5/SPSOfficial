# Deployment Guide for SPS

## Deploying to GitHub Pages

### Step 1: Repository Setup

1. Ensure your GitHub repository is named `SPSOfficial` or update the deploy script
2. Make sure you have SSH keys set up for GitHub or use HTTPS with personal access token

### Step 2: Configure Base Path (if deploying to subdirectory)

If deploying to `https://username.github.io/SPSOfficial/`, update `vite.config.js`:

```javascript
export default defineConfig({
  base: '/SPSOfficial/',
  // ... rest of config
})
```

For `https://username.github.io/`, keep `base: '/'`

### Step 3: Deploy

Run the deploy command:

```bash
npm run deploy
```

This will:
1. Build the project
2. Add the `dist` folder
3. Create a commit
4. Push to the `gh-pages` branch

### Step 4: Enable GitHub Pages

1. Go to your repository settings
2. Scroll to "GitHub Pages"
3. Select `gh-pages` as the deployment branch
4. Click Save

### Step 5: Verify Deployment

Your site will be available at:
- For user/organization pages: `https://username.github.io`
- For project pages: `https://username.github.io/SPSOfficial`

## Deploying to Custom Domain

If you have a custom domain:

1. Add a `CNAME` file to the `public/` folder with your domain:
   ```
   example.com
   ```

2. Configure your domain's DNS to point to GitHub Pages
3. Deploy using `npm run deploy`

## Environment Variables

For production Firebase configuration, you can:

### Option 1: Update src/config.js directly
```javascript
export const firebaseConfig = {
  apiKey: "YOUR_PRODUCTION_KEY",
  // ...
};
```

### Option 2: Use environment variables with Vite

Create a `.env.production` file:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ...
```

Then update `src/config.js`:
```javascript
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    // ...
};
```

## Security Considerations

1. **Never commit Firebase keys to public repositories**
   - Use environment variables
   - Add `.env*.local` to `.gitignore`

2. **Set up Firebase Security Rules**
   - See README.md for recommended rules
   - Test rules before deploying

3. **Enable Firebase App Check (Production)**
   - Prevents unauthorized API access
   - Configure in Firebase Console

## Monitoring & Maintenance

1. **Check Firebase Usage**
   - Monitor Realtime Database reads/writes
   - Keep an eye on bandwidth usage
   - Review authentication events

2. **PWA Updates**
   - Service Worker cache busting happens automatically
   - Users on older cached versions may need to refresh

3. **Database Backups**
   - Set up regular Firebase backups
   - Use Firebase Cloud Backups feature

## Troubleshooting Deployment

### 404 Errors on Refresh
- Ensure Vite config has correct `base` path
- Check that `dist/` folder has all files

### Service Worker Not Loading
- Verify `sw.js` is in the root of `dist/`
- Check browser DevTools > Application > Service Workers

### Firebase Not Connecting
- Verify Firebase config is correct
- Check CORS settings in Firebase Console
- Ensure database rules allow access

### PWA Not Installing
- Site must be served over HTTPS
- Check manifest.json is accessible
- Verify icons are present in `public/icons/`

## Rollback Procedure

If deployment has issues:

```bash
# Revert to previous version
git log --oneline
git revert <commit-hash>
git push origin gh-pages
```

## Performance Optimization

1. **Minimize Firebase reads**
   - Cache messages locally
   - Implement pagination

2. **Optimize assets**
   - Images are already optimized via Vite
   - Monitor bundle size with `npm run build`

3. **Enable compression**
   - GitHub Pages automatically gzips responses
   - No additional configuration needed

---

For additional help, refer to:
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Hosting Alternative](https://firebase.google.com/docs/hosting)
