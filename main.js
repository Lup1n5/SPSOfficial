import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, onValue, get, off } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
//import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { getAuth, 
         createUserWithEmailAndPassword, 
         signInWithEmailAndPassword, 
         GoogleAuthProvider,
         signInWithPopup,
         onAuthStateChanged,
         signOut } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';
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