import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, onValue, get, off } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
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
const db = getDatabase(app);

const usernameDisplay = document.getElementById('user-name')
const loggedInView = document.getElementById('logged-in-view')
const loggedOutView = document.getElementById('logged-out-view')
const usernameSignInForm = document.getElementById('signin-email-input')
const loginBtn = document.getElementById('sign-in-btn')
const logoutBtn = document.getElementById('logout-button')
const chatMessages = document.querySelector('.chat-messages')
const chatInput = document.querySelector('.chat-input')
const sendBtn = document.querySelector(".send-button")
let user = '';
let blocker = 1;
const userCountRef = ref(db, 'userCount'); // Move userCountRef to global scope
const allmessages = ref(db, "messages"); // Move allmessages to global scope

function logout() {
  let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  let message = {
    sender: "Server",
    text: `${user} has disconnected.`,
    timestamp,
    id: generateMessageId(), // Add unique ID
  }
  const messageRef = ref(db,`messages/${user}`)
  set(messageRef,message)
  while (chatMessages.childElementCount !=0) { 
    chatMessages.removeChild(chatMessages.firstElementChild); 
    chatMessages.remove(chatMessages.firstElementChild)
  }
  setTimeout(function(){
    const messageRef = ref(db,`messages/${user}`)
    set(messageRef, null)
    const pingsRef = ref(db,`pings/${user}`)
    set(pingsRef, null)
    const usersRef = ref(db,`users/${user}`)
    set(usersRef, null)
  }, 100);
    loggedInView.style.display = 'none' 
    loggedOutView.style.display = 'block'
  location.reload(true);
}
function checkAdmPings() {
  const adminPingsRef = ref(db,`admpings/${user}`)
  get(adminPingsRef).then((snapshot) => {
    switch (snapshot.val()) {
      case 'mute'||'muted':
      set(adminPingsRef, 'muted')
      return true;
      case 'unmute':
      set(adminPingsRef, 'unmuted')
      return false;
      case 'kick':
      set(adminPingsRef, 'recieved')
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
}
function login(username) {
  user = username;
  usernameDisplay.innerText = user;
  let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  let message = {
    sender: "Server",
    text: `${user} has connected.`,
    timestamp,
    id: generateMessageId(), // Add unique ID
  };
  const messageRef = ref(db, `messages/${user}`);
  set(messageRef, message);
  createChatMessageElement(message, user);
  const pingsRef = ref(db, `pings/${user}`);
  set(pingsRef, 'idle');
  onValue(pingsRef, (snapshot) => {
    switch (snapshot.val()) {
      case 'pinging':
        set(pingsRef, 'recieved');
        break;
    }
  });
  const adminPingsRef = ref(db, `admpings/${user}`);
  onValue(adminPingsRef, () => {
    checkAdmPings();
  });
  const usersRef = ref(db, `users/${user}`);
  set(usersRef, user);
  get(userCountRef).then((DataSnapshot) => {
    set(userCountRef, DataSnapshot.val() + 1);
  });

  let messageListeners = {}; // Store active listeners for each message
  let initialized = false; // Track if the listener is being initialized

  onValue(userCountRef, () => {
    // Remove all existing listeners for messages
    Object.keys(messageListeners).forEach((poop) => {
      const userRef = ref(db, `messages/${poop}/text`);
      if (messageListeners[poop]) {
        off(userRef, messageListeners[poop]); // Properly remove the listener
        delete messageListeners[poop]; // Remove from the tracking object
      }
    });

    // Re-add the listener for all messages
    get(allmessages).then((snapshot) => {
      if (snapshot.exists()) {
        Object.keys(snapshot.val()).forEach((poop) => {
          const userRef = ref(db, `messages/${poop}/text`);
          if (!messageListeners[poop]) {
            messageListeners[poop] = onValue(userRef, (userSnapshot) => {
              if (userSnapshot.exists() && initialized) {
                const reef = ref(db, `messages/${poop}`);
                get(reef).then((messageSnapshot) => {
                  if (messageSnapshot.exists()) {
                    let snap = messageSnapshot.val();
                    const sanitizedId = `msg-${CSS.escape(poop)}`; // Sanitize the ID
                    if (
                      snap.sender != user &&
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

  loggedOutView.style.display = 'none';
  loggedInView.style.display = 'block';
}



loginBtn.addEventListener('click', () => {    
  login('"' + usernameSignInForm.value.replaceAll('"', '') + '"')
  usernameSignInForm.value = ""
  })
usernameSignInForm.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    loginBtn.click();
  }
});

logoutBtn.addEventListener('click', () => {logout()})
// Utility function to generate a unique ID for each message
const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Update createChatMessageElement to check for existing messages in the DOM
const createChatMessageElement = (message) => {
  // Check if a message with the same ID already exists in the DOM
  if (document.querySelector(`[data-message-id="${message.id}"]`)) {
    return; // Do not create a duplicate message element
  }

  const newMessage = document.createElement("div");
  newMessage.setAttribute("data-message-id", message.id); // Add unique identifier to the DOM element
    newMessage.innerHTML = `<div class="message ${message.sender === user ? 'blue-bg' : message.text.replace('"', '').includes('@' + user.replaceAll('"','')) ? 'yello-bg' : 'gray-bg'}">
      <div class="message-sender">${message.timestamp}: ${message.sender.replaceAll('"', '')}</div>
      <div class="message-text">${message.text}</div>
    </div>`;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Modify the send button click handler to include a unique ID for each message
sendBtn.addEventListener('click', () => {
  if (chatInput.value !== "/tab") {
    let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    let message = {
      sender: user,
      text: chatInput.value,
      timestamp,
      id: generateMessageId(), // Add unique ID to the message
    };
    if (message.text) {
      const messageRef = ref(db, `messages/${user}`);
      if (!checkAdmPings()) {
        set(messageRef, message);
        const counterRef = ref(db, 'messageCount');
        get(counterRef).then((DataSnapshot) => {
          set(counterRef, DataSnapshot.val() + 1);
        });
      }
      createChatMessageElement(message);  
      chatInput.value = "";
    }
  } else {
    const refage = ref(db, `pings`);

    get(refage).then((snapshot) => {
      Object.keys(snapshot.val()).forEach((poop) => {
        const refrence = ref(db, `pings/${poop}`);
        set(refrence, 'pinging');
      });

      setTimeout(function () {
        const refage = ref(db, `pings`);
        let output = [];
        get(refage).then((snapshot) => {
          const ids = Object.keys(snapshot.val());
          const vals = Object.values(snapshot.val());
          for (var i = 0; i < ids.length; i++) {
            if (vals[i] == 'recieved') {
              output.push(ids[i]);
            }
          }
          if (output.length === 0) {
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
              const refage = ref(db, `users/${snap}`);
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
          const refage = ref(db, `pings/${snap}`);
          set(refage, 'idle');
        });
      }, 1000);
    });

    chatInput.value = "";
  }
});

// Update the listener for incoming messages to handle unique IDs
onValue(userCountRef, () => {
  // ...existing code to remove and re-add listeners...
  get(allmessages).then((snapshot) => {
    if (snapshot.exists()) {
      Object.values(snapshot.val()).forEach((message) => {
        if (message.id) {
          createChatMessageElement(message); // Use the unique ID to avoid duplicates
        }
      });
    }
  });
});

chatInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBtn.click();
  }
});