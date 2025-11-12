// iOS PWA Push Notification Diagnostic Tool
// Add this to your console to debug push notification issues

function diagnosePWAPush() {
  console.log('=== iOS PWA Push Notification Diagnostic ===');
  
  // Check PWA context
  const isStandalone = window.navigator.standalone === true;
  const isDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
  const isPWA = isStandalone || isDisplayMode;
  
  console.log('PWA Context:');
  console.log('  - navigator.standalone:', window.navigator.standalone);
  console.log('  - display-mode standalone:', isDisplayMode);
  console.log('  - Is PWA:', isPWA);
  console.log('  - User Agent:', navigator.userAgent);
  
  // Check Service Worker
  console.log('\nService Worker:');
  console.log('  - Supported:', 'serviceWorker' in navigator);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('  - Registrations count:', registrations.length);
      registrations.forEach((reg, index) => {
        console.log(`  - Registration ${index}:`, {
          scope: reg.scope,
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL
        });
      });
    });
  }
  
  // Check Push Manager
  console.log('\nPush Manager:');
  console.log('  - Supported:', 'PushManager' in window);
  console.log('  - Notification permission:', Notification.permission);
  
  // Check current subscription
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      return registration.pushManager.getSubscription();
    }).then(subscription => {
      console.log('\nCurrent Subscription:');
      if (subscription) {
        console.log('  - Endpoint:', subscription.endpoint);
        console.log('  - Expiration Time:', subscription.expirationTime);
        console.log('  - Has p256dh key:', !!subscription.getKey('p256dh'));
        console.log('  - Has auth key:', !!subscription.getKey('auth'));
      } else {
        console.log('  - No active subscription found');
      }
    }).catch(error => {
      console.log('  - Error getting subscription:', error);
    });
  }
  
  // Check Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  console.log('\nManifest:');
  console.log('  - Manifest link found:', !!manifestLink);
  if (manifestLink) {
    console.log('  - Manifest URL:', manifestLink.href);
  }
  
  // iOS specific checks
  console.log('\niOS Specific:');
  console.log('  - Is iOS:', /iPad|iPhone|iPod/.test(navigator.userAgent));
  console.log('  - Is Safari:', /^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  console.log('  - iOS Version:', navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/));
  
  console.log('\n=== Diagnostic Complete ===');
}

// Auto-run diagnostic
diagnosePWAPush();
