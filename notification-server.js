// Backend notification sender (for testing purposes)
// This would typically run on a server like Node.js or Cloud Functions

const admin = require('firebase-admin');
const webpush = require('web-push');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'BJo1BD-PijqyL2M0xNwy0xvOfFurS2d2vxG7LK78OtqJDgoogUuQbPp-iJ6QpuQNqFf5ljXaUmoPjZwNC2DlGSY', // Public key
  'YOUR_PRIVATE_VAPID_KEY_HERE' // You need to generate this
);

// Initialize Firebase Admin
const serviceAccount = require('./path/to/your/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://stewflandic-permission-system-default-rtdb.firebaseio.com'
});

const db = admin.database();

// Listen for notification queue
db.ref('notificationQueue').on('child_added', async (snapshot) => {
  const notificationData = snapshot.val();
  
  console.log('Processing notification:', notificationData);
  
  const { payload, senderUid, subscriptions } = notificationData;
  
  // Send to all subscriptions except the sender
  const promises = Object.entries(subscriptions).map(([uid, subscription]) => {
    if (uid !== senderUid) { // Don't send to sender
      return webpush.sendNotification(subscription, JSON.stringify(payload))
        .catch(error => {
          console.error('Error sending notification to', uid, ':', error);
          // Optionally remove invalid subscriptions
        });
    }
  }).filter(Boolean);
  
  try {
    await Promise.all(promises);
    console.log('Notifications sent successfully');
    
    // Remove processed notification from queue
    await snapshot.ref.remove();
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
});

console.log('Notification service running...');
