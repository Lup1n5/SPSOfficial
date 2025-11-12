// Backend notification sender (for testing purposes)
// This would typically run on a server like Node.js or Cloud Functions

const admin = require('firebase-admin');
const webpush = require('web-push');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'BOTUZEYhxChOXBdKsnmGdtmUq210kpYm6exbwPo1j7sgEp4qj9kQ0yN5uD52BZKgMfrShKyLH77ahubYg7Qrjd4', // Public key
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

  const { payload, senderUid } = notificationData;

  try {
    // Fetch current push subscriptions from the database
    const subsSnap = await db.ref('pushSubscriptions').once('value');
    const subscriptions = subsSnap.val() || {};

    // Send to all subscriptions except the sender
    const sendTasks = Object.entries(subscriptions)
      .filter(([uid]) => uid !== senderUid)
      .map(async ([uid, subscription]) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
          console.log('✓ Notification sent successfully to', uid);
        } catch (error) {
          console.error('✗ Error sending notification to', uid, ':', error.message || error);
          
          // Handle various error conditions that indicate invalid subscriptions
          const shouldRemoveSubscription = 
            error.statusCode === 404 ||  // Not Found
            error.statusCode === 410 ||  // Gone
            error.statusCode === 413 ||  // Payload Too Large
            error.statusCode === 400 ||  // Bad Request
            (error.body && error.body.includes('expired')) ||
            (error.body && error.body.includes('invalid')) ||
            error.message.includes('expired') ||
            error.message.includes('invalid');

          if (shouldRemoveSubscription) {
            console.log(`Removing invalid subscription for user ${uid}`);
            await db.ref(`pushSubscriptions/${uid}`).remove();
          }
        }
      });

    await Promise.all(sendTasks);
    console.log('Notifications sent successfully');

    // Remove processed notification from queue
    await snapshot.ref.remove();
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
});

console.log('Notification service running...');
