import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, onValue, get, off } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
import { getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';
const firebaseConfig = {
  apiKey: "AIzaSyD68PbyrHLGNYf9Kg_Xb_XKiKegz-Kov7k",
    authDomain: "spin-a3d5a.firebaseapp.com",
    projectId: "spin-a3d5a",
    storageBucket: "spin-a3d5a.firebasestorage.app",
    messagingSenderId: "423644329992",
    appId: "1:423644329992:web:9c14f1c959b8db636639bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const realtimedb = getDatabase(app);

let pingsRef = null; // Declare pingsRef in the global scope
let stopPingListener = false; // Add a flag to control the listener
const usernameDisplay = document.getElementById('user-name')
const logoutBtn = document.getElementById('logout-button')
const chatMessages = document.querySelector('.chat-messages')
const chatInput = document.querySelector('.chat-input')
const sendBtn = document.querySelector(".send-button")
let user= '';
const userCountRef = ref(realtimedb, 'userCount'); // Move userCountRef to global scope
const allmessages = ref(realtimedb, "messages"); // Move allmessages to global scope
const email = sessionStorage.getItem('email');
const password = sessionStorage.getItem('password');
let isHidden = sessionStorage.getItem('ishidden');
function pingManager(isHidden) {
  if (isHidden == 'true') {
    return;
  }
  set(pingsRef, 'recieved');
}
signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
  const nameFind = ref(realtimedb, `usernames/${userCredential.user.uid}`);
  get(nameFind).then((snapshot) => {
    user = snapshot.val();
    pingsRef = ref(realtimedb, `pings/${user}`);
    login();
    onValue(pingsRef, () => {
      if (!stopPingListener) { // Check the flag before executing
        pingManager(isHidden);
      }
    });
  });
}).catch((error) => {
  const errorCode = error.code;
  const errorMessage = error.message;
  console.log(errorCode, errorMessage);
  alert("Error: " + errorMessage);
}
);

function login() {
  usernameDisplay.innerText = user;
  
  
  
  let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  if (isHidden == 'true') {
    let message = {
      sender: "Server",
      text: `Connected as ${user} (Hidden)`,
      timestamp,
      id: generateMessageId(), // Add unique ID
    };
    createChatMessageElement(message, user);
  } else {
    set(pingsRef, 'idle');
    
  let message = {
    sender: "Server",
    text: `${user} has connected.`,
    timestamp,
    id: generateMessageId(), // Add unique ID
  };
  const messageRef = ref(realtimedb, `messages/${user}`);
  set(messageRef, message);
  createChatMessageElement(message, user);
  } 
  

  const usersRef = ref(realtimedb, `users/${user}`);
  set(usersRef, user);
  get(userCountRef).then((DataSnapshot) => {
    set(userCountRef, DataSnapshot.val() + 1);
  });

  let messageListeners = {}; // Store active listeners for each message
  let initialized = false; // Track if the listener is being initialized

  onValue(userCountRef, () => {
    // Remove all existing listeners for messages
    Object.keys(messageListeners).forEach((poop) => {
      const userRef = ref(realtimedb, `messages/${poop}/text`);
      if (messageListeners[poop]) {
        off(userRef, messageListeners[poop]); // Properly remove the listener
        delete messageListeners[poop]; // Remove from the tracking object
      }
    });

    // Re-add the listener for all messages
    get(allmessages).then((snapshot) => {
      if (snapshot.exists()) {
        Object.keys(snapshot.val()).forEach((poop) => {
          const userRef = ref(realtimedb, `messages/${poop}/text`);
          if (!messageListeners[poop]) {
            messageListeners[poop] = onValue(userRef, (userSnapshot) => {
              if (userSnapshot.exists() && initialized) {
                const reef = ref(realtimedb, `messages/${poop}`);
                get(reef).then((messageSnapshot) => {
                  if (messageSnapshot.exists()) {
                    let snap = messageSnapshot.val();
                    const sanitizedId = `msg-${CSS.escape(poop)}`; // Sanitize the ID
                    if (
                      snap.sender != user&&
                      snap.text != `${user} has connected.` &&
                      !document.querySelector(`[data-message-id="${sanitizedId}"]`) // Avoid duplicate DOM elements
                    ) {
                      createChatMessageElement(snap, sanitizedId);
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
  })
  setTimeout(() => {
    initialized = true;
  }
  , 100);
}

logoutBtn.addEventListener('click', () => {
    if (isHidden == false) {
  let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  let message = {
    sender: "Server",
    text: `${user} has disconnected.`,
    timestamp,
    id: generateMessageId(), // Add unique ID
  }
  const messageRef = ref(realtimedb,`messages/${user}`)
  set(messageRef,message)
}
  signOut(auth)
  window.location.href = 'index.html'; // Redirect to index.html
});
// Utility function to generate a unique ID for each message
const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Update createChatMessageElement to check for existing messages in the DOM
const createChatMessageElement = (message) => {
  // Check if a message with the same ID already exists in the DOM
  if (document.querySelector(`[data-message-id="${message.id}"]`)) {
    return; // Do not create a duplicate message element
  }

  
  if (new Date(message.timestamp) < Date.now()- 60000) {
    return; // Ignore messages older than 1 minute
  }
  const newMessage = document.createElement("div");
  newMessage.setAttribute("data-message-id", message.id); // Add unique identifier to the DOM element
    newMessage.innerHTML = `<div class="message ${message.sender === user? 'blue-bg' : message.text.replace('"', '').includes('@' + user.replaceAll('"','')) ? 'yello-bg' : 'gray-bg'}">
      <div class="message-sender">${message.timestamp}: ${message.sender.replaceAll('"', '')}</div>
      <div class="message-text">${message.text}</div>
    </div>`;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Modify the send button click handler to include a unique ID for each message
sendBtn.addEventListener('click', () => {
  if (chatInput.value[0] !== '/') {
    let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    let message = {
      sender: user,
      text: chatInput.value,
      timestamp,
      id: generateMessageId(), // Add unique ID to the message
    };
    if (message.text) {
      const messageRef = ref(realtimedb, `messages/${user}`);

        set(messageRef, message);
        const counterRef = ref(realtimedb, 'messageCount');
        get(counterRef).then((DataSnapshot) => {
          set(counterRef, DataSnapshot.val() + 1);
        });
      
      createChatMessageElement(message);  
      chatInput.value = "";
    }
  } else {
    const messageRef = ref(realtimedb, `messages/${user}`);
    let commandParts = chatInput.value.replace('/', '').split(' '); // Split command into parts

    switch (commandParts[0]) {
      case 'tab':
        const refage = ref(realtimedb, `pings`);

    get(refage).then((snapshot) => {
      Object.keys(snapshot.val()).forEach((poop) => {
        const refrence = ref(realtimedb, `pings/${poop}`);
        set(refrence, 'pinging');
      });

      setTimeout(function () {
        const refage = ref(realtimedb, `pings`);
        let output = [];
        get(refage).then((snapshot) => {
          console.log(snapshot.val());
          const ids = Object.keys(snapshot.val());
          const vals = Object.values(snapshot.val());
          for (var i = 0; i < ids.length; i++) {
            if (vals[i] == 'recieved') {
              if (ids[i] == null) {
                output.push('1 hidden user');
              } else {
              output.push(ids[i]);
              }
            }
          }
          console.log(output);
          if (output.length < 2) {
            let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message = {
              sender: 'TABLIST',
              text: `Nobody is online.`,
              timestamp,
              id: generateMessageId(), // Add unique ID
            };
            createChatMessageElement(message);
          } else {
            output.forEach((snap) => {
              const refage = ref(realtimedb, `users/${snap}`);
              get(refage).then((snapshot) => {
                let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
                let message = {
                  sender: 'TABLIST',
                  text: `${snapshot.val()} is online.`,
                  timestamp,
                  id: generateMessageId(), // Add unique ID
                };
                if (snapshot.val() !== user) {
                  createChatMessageElement(message);
                }
              });
            });
          }
        });

        output.forEach((snap) => {
          const refage = ref(realtimedb, `pings/${snap}`);
          set(refage, 'idle');
        });
      }, 1000);
    });

    break;

      case 'mute':
        let target = commandParts[1]; // Ensure target is scoped here
        if (!target) {
          alert("Please specify a user to mute.");
          return;
        }
        const muteRef = ref(realtimedb, `admpings/${target}`);
        set(muteRef, 'mute');
        const watcher = onValue(muteRef, (snapshot) => {  
          if (snapshot.val() === 'muted') {
            let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message = {
              sender: "Server",
              text: `${target} has been muted.`,
              timestamp,
              id: generateMessageId(), // Add unique ID
            };
            createChatMessageElement(message);
            off(muteRef, watcher); // Remove the listener
          }
        });
        break;

      case 'unmute':
        target = commandParts[1]; // Reuse target variable
        if (!target) {
          alert("Please specify a user to unmute.");
          return;
        }
        set(muteRef, 'unmute');
        const watcher2 = onValue(muteRef, (snapshot) => {  
          if (snapshot.val() === 'unmuted') {
            let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message = {
              sender: "Server",
              text: `${target} has been unmuted.`,
              timestamp,
              id: generateMessageId(), // Add unique ID
            };
            createChatMessageElement(message);
            off(muteRef, watcher2); // Remove the listener
          }
        });
        break;

      case 'kick':
        let target2 = commandParts[1]; // Ensure target2 is scoped here
        if (!target2) {
          alert("Please specify a user to kick.");
          return;
        }
        const kickRef = ref(realtimedb, `admpings/${target2}`);
        set(kickRef, 'kick');
        let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
        let message = { 
          sender: "Server",
          text: `Kick request sent to ${target2}...`,
          timestamp,
          id: generateMessageId(), // Add unique ID
        };
        createChatMessageElement(message);
        const watcher3 = onValue(kickRef, (snapshot) => {  
          if (snapshot.val() === 'kicked') {
            let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message = {
              sender: "Server",
              text: `${target2} has been successfully kicked.`,
              timestamp,
              id: generateMessageId(), // Add unique ID
            };
            createChatMessageElement(message);
            off(kickRef, watcher3); // Remove the listener
          }
        });
        break;

      case 'hide':
        if (isHidden == true) {
          alert("You are already hidden.");
          return;
        }
        
        let message2 = { 
          sender: "Server",
          text: `${user} has disconnected.`,
          timestamp:new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
          id: generateMessageId(), // Add unique ID
        };
        set(messageRef, message2);
        createChatMessageElement(message2);
        
        isHidden = true;
        break;

      case 'unhide':
        if (isHidden == false) {
          alert("You are already visible.");
          return;
        }

        let timestamp3 = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
        let message3 = { 
          sender: "Server",
          text: `${user} has connected.`,
          timestamp: timestamp3,
          id: generateMessageId(), // Add unique ID
        };
        set(messageRef, message3);
        createChatMessageElement(message3);

        isHidden = false;
        break;

      case 'sendAs':
        let target3 = commandParts[1];
        let messageText = commandParts.slice(2).join(' '); // Join the rest of the command as the message text
        if (!target3 || !messageText) {
          alert("Please specify a user and a message to send.");
          return;
        }
        const sendAsRef = ref(realtimedb, `messages/${user}`);
        let timestamp4 = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
        let message4 = { 
          sender: target3,
          text: messageText,
          timestamp: timestamp4, // Fix timestamp property
          id: generateMessageId(), // Add unique ID
        };
        set(sendAsRef, message4);
        createChatMessageElement(message4);
        break;

      case 'help':
        let helpMessage = {
          sender: "Server",
          text: `Available commands: /tab, /mute [user], /unmute [user], /kick [user], /hide, /unhide, /sendAs [user] [message], /help`,
          timestamp: new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
          id: generateMessageId(), // Add unique ID
        };
        createChatMessageElement(helpMessage);
        break;
  }
  chatInput.value = "";
}
});
chatInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBtn.click();
  }
});