import { initializeApp } from './node_modules/firebase/app';
import { getDatabase, ref, set, onValue, get, off } from './node_modules/firebase/database';
//import { getFirestore } from './node_modules/firebase/firestore';
import { getAuth,  
         signInWithEmailAndPassword, 
         onAuthStateChanged,
         signOut } from './node_modules/firebase/auth';
// Remove Firebase Messaging for iOS PWA compatibility
// import { getMessaging, getToken, onMessage } from './node_modules/firebase/messaging';
const firebaseConfig = {
  apiKey: "AIzaSyAYjLbsdGgVccTHa_bpEaDh7orYmzldiMk",
  authDomain: "stewflandic-permission-system.firebaseapp.com",
  databaseURL: "https://stewflandic-permission-system-default-rtdb.firebaseio.com",
  projectId: "stewflandic-permission-system",
  storageBucket: "stewflandic-permission-system.firebasestorage.app",
  messagingSenderId: "1035943934052",
  appId: "1:1035943934052:web:d3b8c6802c9a99ec81c771"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
//const firestoredb = getFirestore(app);
const realtimedb = getDatabase(app);
// Remove messaging for iOS PWA compatibility
// const messaging = getMessaging(app);

const spinBtn = document.getElementById('spin-button')
const hiddenToggle = document.getElementById('hiddenToggle')
const loggedInView = document.getElementById('logged-in-view')
const loggedOutView = document.getElementById('logged-out-view')
const userEmail = document.getElementById('user-email')
const emailSignInForm = document.getElementById('signin-email-input')
const passwordSignInForm = document.getElementById('signin-password-input')
const loginBtn = document.getElementById('sign-in-btn')
const logoutBtn = document.getElementById('logout-button')
const chatMessages = document.querySelector('.chat-messages')
const chatInputForm = document.querySelector('.chat-input-form')
const chatInput = document.querySelector('.chat-input')
const sendBtn = document.querySelector(".send-button")
var messageSender = ''
var email = ""
let uid = '';
let isHidden = false;
let userList = [];
let isAppInForeground = true;
let pushSubscription = null;
function logout() {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has disconnected.`,
    timestamp,
  }
  const messageRef = ref(realtimedb,`messages/${uid}`)
  set(messageRef,message)
  for (var i = 0; i<chatMessages.childElementCount; i++) { 
    chatMessages.removeChild(chatMessages.firstChild); 
  }
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
    location.reload(true)
  
}
const checkAdmPings = async () => { // Ensure proper case handling
  const adminPingsRef = ref(realtimedb, `admpings/${uid}`);
  const snapshot = await get(adminPingsRef);
  switch (snapshot.val()) {
    case 'mute':
    case 'muted':
      await set(adminPingsRef, 'muted'); // Ensure this is awaited
      return true;
    case 'unmute':
    case 'unmuted':
      await set(adminPingsRef, 'unmuted'); // Ensure this is awaited
      return false;
    default:
      return false;
  }
};
onAuthStateChanged(auth, async (user) => { // Await checkAdmPings here
    if (user) {
      uid = user.uid;
      email = user.email;
      await checkAdmPings(); // Ensure this is awaited
      //console.log(email)
      loggedInView.style.display = 'block'
      userEmail.innerText = email
      await setupPushNotifications();
      
      if (!sessionStorage.getItem('password') && passwordSignInForm.value == "") {
        logout()
      } else if (sessionStorage.getItem('email') != email) {
        sessionStorage.setItem('email', email);
        sessionStorage.setItem('password', passwordSignInForm.value);
      }
      emailSignInForm.value = ""
      passwordSignInForm.value = ""
      loggedOutView.style.display = 'none'
      messageSender = email
      const refage = ref(realtimedb, `pings/${uid}`)
      const refag = ref(realtimedb, `users/${uid}`)
      get(refag).then((snapshot) => {
        set(refag, email)
        if (snapshot.val() == 'refresh') {
          logout();
        } 
      })
      const userRef = ref(realtimedb, `users`);
      get(userRef).then((snapshot) => {
        userList = snapshot.val();
      })
      const adminPingsRef = ref(realtimedb,`admpings/${uid}`)
      onValue(adminPingsRef, (snapshot) => {
        switch (snapshot.val()) {
          case 'mute'||'muted':
          set(adminPingsRef, 'muted')
          break
          case 'unmute':
          set(adminPingsRef, 'unmuted')
          break
          case 'kick':
          set(adminPingsRef, 'kicked')
          logout();
          break;
          case 'ban'||'banned':
          set(adminPingsRef, 'banned')
          logout();
          break;
          default:
          return false;
        }
      })
      let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has connected.`,
    timestamp,
  }
  const messageRef = ref(realtimedb,`messages/${uid}`)
  set(messageRef,message)
      get(refage).then((snapshot) =>{
        if (!snapshot.val()) {
          set(refage, 'x')
        }
      })
      const pingPong = ref(realtimedb, `pings/${uid}`)
onValue(pingPong,(snapshot) =>{
  const snapp = snapshot.val()
  if (snapp =='pinging' && document.visibilityState !== 'hidden') {
    set(pingPong, 'recieved')
}})
let initialized = false;
const allmessages = ref(realtimedb, "messages")
get(allmessages).then((snapshot) =>{
  Object.keys(snapshot.val()).forEach((poop) => {
    const userRef = ref(realtimedb, `messages/${poop}/text`)
    onValue(userRef, () =>{
  const reef = ref(realtimedb, `messages/${poop}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    if (snap.sender != messageSender && initialized) {
      createChatMessageElement(snap)
      
      // If app is in foreground, don't show browser notification
      // The message will be displayed in the chat instead
      if (isAppInForeground) {
        console.log('Message received while app in foreground - showing in chat only');
      }
    } 

  })
})
  });
  initialized = true;
})

    } else {
      // User is signed out
      loggedInView.style.display = 'none' 
      loggedOutView.style.display = 'block'
       
    }
  });
loginBtn.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailSignInForm.value, passwordSignInForm.value)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            //console.log(user)
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            //console.log(errorMessage)
            passwordSignInForm.value = ""
        });
  })
passwordSignInForm.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    loginBtn.click();
  }
});

logoutBtn.addEventListener('click', () => {logout()})
const createChatMessageElement = (message) => {
  const newMessage = document.createElement("div");
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let time1 = timestamp.replace(/[:APM]/g, ""); 
  let time2 = message.timestamp.replace(/[:APM]/g, ""); 
  if (Math.abs(Number(time2)-Number(time1)) <2) {
newMessage.innerHTML = `<div class="message ${message.sender === messageSender ? 'blue-bg' : message.text.includes('@'+messageSender.replace("@providenceday.org",'')) == true ? 'yello-bg' : 'gray-bg'}">
  <div class="message-top"><div class="message-sender">${message.sender.split('.')[0]}</div>
  <div class="message-timestamp">${message.timestamp}</div></div>
  <div class="message-text">${message.text}</div>
  </div>`;
chatMessages.appendChild(newMessage);
chatMessages.scrollTop = chatMessages.scrollHeight
  }
}
const checkForPerms = async () => {
  const refage = ref(realtimedb, `AdminMan`);
  const snapshot = await get(refage);
  if (snapshot.val() == uid) {
    return true;
  } else {
    return false;
  }
};

sendBtn.addEventListener('click', async () => {
  if (chatInput.value.length > 200) {
    alert("Message too long. Please keep it under 200 characters.");
    chatInput.value = "";
    return;
  }
  let isAdmin = await checkForPerms();
  if (isAdmin && chatInput.value[0] == '/' && chatInput.value != "/tab") {
    let commandParts = chatInput.value.replace('/', '').split(' '); // Split command into parts
    let target = null;
    if (commandParts[1]) {
      
      if(commandParts[1][0] == '@') {
        commandParts[1] = commandParts[1].substring(1);
        if (!commandParts[1].includes('@providenceday.org')) {     
          commandParts[1] = commandParts[1] + '@providenceday.org';
        }
        target = commandParts[1];
      } else if(commandParts[1][0] =='!'){
        commandParts[1] = commandParts[1].substring(1);
        target = commandParts[1];
      }else if(commandParts[1] == 'on' || commandParts[1] == 'off'){
        target = commandParts[1];
      } else{
    if (!commandParts[1].includes('@providenceday.org')) {     
      commandParts[1] = commandParts[1] + '@providenceday.org';
    }
    // Fix target assignment logic
    Object.entries(userList).forEach(([key, value]) => {
      
      if (value === commandParts[1]) {
        target = key;
      }
    });}
  }

    if (!target && ['mute', 'unmute', 'kick', 'sendAs'].includes(commandParts[0])) {
      alert("Please specify a valid user.");
      return;
    }

    switch (commandParts[0]) {
      case 'hide':
        if (commandParts[1] == 'on') {
        isHidden = true;
        alert("You are now hidden.");
        } else if (commandParts[1] == 'off') {
          isHidden = false;
          alert("You are now visible.");
        } else if (commandParts[1] == '') {
          alert(isHidden ? "You are hidden." : "You are visible.");
        } else {
          alert("Please specify 'on', 'off' or nothing.");
        }
        break;
      case 'mute':
        const muteRef = ref(realtimedb, `admpings/${target}`);
        set(muteRef, 'mute');
        onValue(muteRef, (snapshot) => {
          if (snapshot.val() === 'muted') {
            let message = {
              sender: "Server",
              text: `${commandParts[1]} has been muted.`,
              timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            };
            createChatMessageElement(message);
            off(muteRef); // Remove the listener
          }
        });
        break;

      case 'unmute':
        const unmuteRef = ref(realtimedb, `admpings/${target}`);
        set(unmuteRef, 'unmute');
        onValue(unmuteRef, (snapshot) => {
          if (snapshot.val() === 'unmuted') {
            let message = {
              sender: "Server",
              text: `${commandParts[1]} has been unmuted.`,
              timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            };
            createChatMessageElement(message);
            off(unmuteRef); // Remove the listener
          }
        });
        break;

      case 'kick':
        const kickRef = ref(realtimedb, `admpings/${target}`);
        set(kickRef, 'kick');
        let kickMessage = {
          sender: "Server",
          text: `Kick request sent to ${commandParts[1]}...`,
          timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        };
        createChatMessageElement(kickMessage);
        onValue(kickRef, (snapshot) => {
          if (snapshot.val() === 'kicked') {
            let message = {
              sender: "Server",
              text: `${commandParts[1]} has been successfully kicked.`,
              timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            };
            createChatMessageElement(message);
            off(kickRef); // Remove the listener
          }
        });
        break;

      case 'sendAs':
        const sendAsRef = ref(realtimedb, `messages/${uid}`);
        let messageText = commandParts.slice(2).join(' '); // Join the rest of the command as the message text
        if (!messageText) {
          alert("Please specify a message to send.");
          return;
        }
        let sendAsMessage = {
          sender: commandParts[1],
          text: messageText,
          timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        };
        set(sendAsRef, sendAsMessage);
        createChatMessageElement(sendAsMessage);
        break;

      case 'help':
        let helpMessage = {
          sender: "Server",
          text: `Available commands: /tab, /mute [user], /unmute [user], /kick [user], /sendAs [user] [message], /help`,
          timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        };
        createChatMessageElement(helpMessage);
        break;

      default:
        alert("Unknown command.");
        break;
    }
    chatInput.value = "";
  }
  if (chatInput.value != "/tab") {
    let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    let message = {
      sender: messageSender,
      text: chatInput.value,
      timestamp,
    };
    if (message.text) {
      const messageRef = ref(realtimedb, `messages/${uid}`);
      if (!(await checkAdmPings())) { // Await checkAdmPings here
        await set(messageRef, message); // Ensure this is awaited
        const counterRef = ref(realtimedb, 'messageCount');
        const DataSnapshot = await get(counterRef); // Await get here
        await set(counterRef, DataSnapshot.val() + 1); // Ensure this is awaited
        
        // Send push notification to all users except sender
        await sendNotificationToAllUsers(message);
      }
      createChatMessageElement(message);
      chatInput.value = "";
    }
  } else {

  const refage = ref(realtimedb, `pings`)

  get(refage).then((snapshot) =>{
    Object.keys(snapshot.val()).forEach((poop) =>{
      const refrence = ref(realtimedb, `pings/${poop}`)
      set(refrence, 'pinging')
    })
    setTimeout(function(){
      const refage = ref(realtimedb, `pings`)
      let output = [];
        get(refage).then((snapshot)=>{
         const ids = Object.keys(snapshot.val())
         const vals = Object.values(snapshot.val())
          for(var i = 0; i<ids.length; i++) {
            if(vals[i] == 'recieved') {
              output.push(ids[i])
            }
          }
          if(output.length ==1) {
            let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
          let message = {
            sender: 'TABLIST',
            text: `Nobody is online.`,
            timestamp,
          }
          createChatMessageElement(message);  
          }
      output.forEach((snap)=>{
        const refage = ref(realtimedb, `users/${snap}`)
        get(refage).then((snapshot)=>{
          let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      let message = {
        sender: 'TABLIST',
        text: `${snapshot.val()} is online.`,
        timestamp,
      }
      if (snapshot.val() !=messageSender) {
      createChatMessageElement(message);  
      }
        })
      })
        })
    }, 1000);
  })
   
  chatInput.value = ""
}

})
chatInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBtn.click();
  }
});
const hiddenForm = document.querySelector('.hidden-form');

// Add a submit event listener to the form
hiddenForm.addEventListener('submit', (event) => {
  event.preventDefault();
});
spinBtn.addEventListener('click', () => {
  sessionStorage.setItem('ishidden', hiddenToggle.checked);
  window.location.href = 'SPiN.html';
})



// Track app visibility to prevent notifications when app is in foreground
document.addEventListener('visibilitychange', () => {
  isAppInForeground = !document.hidden;
  console.log('App visibility changed:', isAppInForeground ? 'foreground' : 'background');
});

// Register service worker for iOS PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('Registering service worker for iOS PWA...');
      
      // iOS PWA specific registration options
      const registrationOptions = {
        scope: './' // Ensure proper scope for iOS PWA
      };
      
      const registration = await navigator.serviceWorker.register('./sw.js', registrationOptions);
      console.log('ServiceWorker registered successfully:', {
        scope: registration.scope,
        installing: registration.installing,
        waiting: registration.waiting,
        active: registration.active
      });
      
      // Handle service worker updates (important for iOS PWA)
      registration.addEventListener('updatefound', () => {
        console.log('Service worker update found');
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('Service worker state changed:', newWorker.state);
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, refreshing...');
              // Optionally refresh the page to use new service worker
              // window.location.reload();
            }
          });
        }
      });
      
    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  });
}

// Setup push notifications for iOS PWA
async function setupPushNotifications() {
  try {
    // Check if we're in a PWA context (iOS specific)
    const isIOSPWA = window.navigator.standalone === true || 
                     window.matchMedia('(display-mode: standalone)').matches ||
                     window.matchMedia('(display-mode: fullscreen)').matches;
    
    console.log('iOS PWA detected:', isIOSPWA);
    console.log('User Agent:', navigator.userAgent);
    
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Wait for service worker to be ready with timeout
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 10000))
      ]);
      
      // Check for push manager support
      if (!('PushManager' in window)) {
        console.log('Push messaging is not supported');
        return;
      }
      
      if (!registration.pushManager) {
        console.log('Push manager unavailable in service worker registration');
        return;
      }
      
      try {
        console.log('Setting up push subscription...');
        
        // Check if already subscribed
        pushSubscription = await registration.pushManager.getSubscription();
        console.log('Existing subscription:', pushSubscription ? 'Found' : 'None');
        
        if (pushSubscription) {
          console.log('Validating existing subscription...');
          // Validate existing subscription
          try {
            const endpoint = pushSubscription.endpoint;
            const p256dh = pushSubscription.getKey('p256dh');
            const auth = pushSubscription.getKey('auth');
            
            if (!endpoint || !p256dh || !auth) {
              throw new Error('Invalid subscription components');
            }
            
            // Check if subscription is expired (iOS specific check)
            if (pushSubscription.expirationTime && pushSubscription.expirationTime < Date.now()) {
              throw new Error('Subscription expired');
            }
            
            console.log('Subscription validation passed');
          } catch (validationError) {
            console.log('Subscription validation failed:', validationError.message);
            try {
              await pushSubscription.unsubscribe();
            } catch (unsubError) {
              console.log('Error unsubscribing invalid subscription:', unsubError);
            }
            pushSubscription = null;
          }
        }
        
        if (!pushSubscription) {
          console.log('Creating new push subscription...');
          
          const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BO7AQkuK-62TR28KVs30sTvXUIpGRaK-fF-Nv-ZrDP4KZ7EGEEHTQTcfUl7k3FlaekK6rQ3HLmhq0nlThhYfETs')
          };
          
          // Add iOS-specific options
          if (isIOSPWA) {
            console.log('Adding iOS-specific subscription options');
            // iOS PWA specific settings
            subscribeOptions.userVisibleOnly = true;
          }
          
          pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
          console.log('New subscription created successfully');
        }
          
        console.log('Final push subscription:', pushSubscription);
        
        // Save subscription to Firebase with enhanced metadata
        if (pushSubscription && uid) {
          const subscriptionRef = ref(realtimedb, `pushSubscriptions/${uid}`);
          
          const subscriptionData = {
            endpoint: pushSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
              auth: arrayBufferToBase64(pushSubscription.getKey('auth'))
            },
            userEmail: email,
            userAgent: navigator.userAgent,
            isIOSPWA: isIOSPWA,
            created: Date.now(),
            lastRefreshed: Date.now()
          };
          
          // Add expiration time if available (iOS provides this)
          if (pushSubscription.expirationTime) {
            subscriptionData.expirationTime = pushSubscription.expirationTime;
          }
          
          await set(subscriptionRef, subscriptionData);
          console.log('Subscription saved to Firebase');
        }
        
      } catch (pushError) {
        console.log('Push subscription setup failed:', pushError);
        console.log('Error details:', {
          name: pushError.name,
          message: pushError.message,
          stack: pushError.stack
        });
      }
    }
  } catch (err) {
    console.log('Notification permission error:', err);
  }
}

// Periodically refresh push subscription to prevent expiration (iOS optimized)
async function refreshPushSubscription() {
  if (!uid) {
    console.log('No user ID available for subscription refresh');
    return;
  }
  
  try {
    console.log('Starting push subscription refresh...');
    
    const registration = await navigator.serviceWorker.ready;
    const currentSubscription = await registration.pushManager.getSubscription();
    
    if (currentSubscription) {
      // Check if subscription is close to expiring (iOS specific)
      const isExpiring = currentSubscription.expirationTime && 
                        currentSubscription.expirationTime < (Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      if (isExpiring) {
        console.log('Subscription is expiring soon, creating new one...');
      } else {
        console.log('Subscription still valid, updating metadata only...');
        // Just update the timestamp without recreating subscription
        const subscriptionRef = ref(realtimedb, `pushSubscriptions/${uid}`);
        const currentData = await get(subscriptionRef);
        if (currentData.exists()) {
          await set(subscriptionRef, {
            ...currentData.val(),
            lastRefreshed: Date.now()
          });
        }
        return;
      }
      
      // Unsubscribe and resubscribe to get a fresh subscription
      await currentSubscription.unsubscribe();
      console.log('Old subscription unsubscribed');
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BJo1BD-PijqyL2M0xNwy0xvOfFurS2d2vxG7LK78OtqJDgoogUuQbPp-iJ6QpuQNqFf5ljXaUmoPjZwNC2DlGSY')
      });
      
      // Update in Firebase with full metadata
      const subscriptionRef = ref(realtimedb, `pushSubscriptions/${uid}`);
      const subscriptionData = {
        endpoint: newSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')),
          auth: arrayBufferToBase64(newSubscription.getKey('auth'))
        },
        userEmail: email,
        userAgent: navigator.userAgent,
        lastRefreshed: Date.now(),
        refreshReason: isExpiring ? 'expiration' : 'periodic'
      };
      
      if (newSubscription.expirationTime) {
        subscriptionData.expirationTime = newSubscription.expirationTime;
      }
      
      await set(subscriptionRef, subscriptionData);
      
      pushSubscription = newSubscription;
      console.log('Push subscription refreshed successfully');
    } else {
      console.log('No existing subscription found during refresh');
    }
  } catch (error) {
    console.log('Error refreshing push subscription:', error);
    console.log('Will retry setup on next app launch');
  }
}

// Refresh subscription every 12 hours (more frequent for iOS PWA reliability)
setInterval(refreshPushSubscription, 12 * 60 * 60 * 1000);

// Also refresh when app becomes visible (iOS PWA best practice)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && pushSubscription) {
    // Delay to ensure app is fully active
    setTimeout(refreshPushSubscription, 5000);
  }
});

// Helper functions for push notifications
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
}

// Send push notification to all users except sender
// Security change: do NOT include subscriptions; backend will fetch them
async function sendNotificationToAllUsers(messageData) {
  try {
    // Create notification payload (no subscription data)
    const notificationPayload = {
      title: 'New Message in SPS',
      body: `${messageData.sender.split('@')[0]}: ${messageData.text}`,
      sender: messageData.sender,
      messageText: messageData.text,
      timestamp: messageData.timestamp
    };

    // Store notification request in Firebase for backend processing
    const notificationRef = ref(realtimedb, `notificationQueue/${Date.now()}`);
    await set(notificationRef, {
      payload: notificationPayload,
      senderUid: uid,
      timestamp: Date.now()
    });

    console.log('Notification queued for backend processing');
  } catch (error) {
    console.log('Error sending notifications:', error);
  }
}
function log(message) {
 let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let messageData = {
    sender: "Server",
    text: message,
    timestamp,
  }
  const messageRef = ref(realtimedb,`messages/${uid}`)
  set(messageRef,messageData)
}

