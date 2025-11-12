// Cleanup script for invalid push subscriptions
// Run this script to remove invalid subscriptions from your Firebase database

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account key)
const serviceAccount = require('./path/to/your/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://stewflandic-permission-system-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function cleanupInvalidSubscriptions() {
  try {
    console.log('Starting subscription cleanup...');
    
    const subsRef = db.ref('pushSubscriptions');
    const snapshot = await subsRef.once('value');
    const subscriptions = snapshot.val() || {};
    
    let cleanedCount = 0;
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const [uid, subscription] of Object.entries(subscriptions)) {
      // Remove subscriptions that haven't been refreshed in over a week
      if (!subscription.lastRefreshed || subscription.lastRefreshed < oneWeekAgo) {
        console.log(`Removing old subscription for user: ${uid}`);
        await db.ref(`pushSubscriptions/${uid}`).remove();
        cleanedCount++;
      }
      
      // Check for malformed subscriptions
      if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        console.log(`Removing malformed subscription for user: ${uid}`);
        await db.ref(`pushSubscriptions/${uid}`).remove();
        cleanedCount++;
      }
    }
    
    console.log(`Cleanup complete. Removed ${cleanedCount} invalid subscriptions.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  
  process.exit(0);
}

cleanupInvalidSubscriptions();
