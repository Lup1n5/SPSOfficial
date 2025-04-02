import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, onValue, get } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
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
const db = getDatabase(app);

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
let isMuted = 0;
let userList = [];
function logout() {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has disconnected.`,
    timestamp,
  }
  const messageRef = ref(db,`messages/${uid}`)
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
function checkAdmPings() {
  const adminPingsRef = ref(db,`admpings/${uid}`)
  get(adminPingsRef).then((snapshot) => {
    switch (snapshot.val()) {
      case 'mute'||'muted':
      set(adminPingsRef, 'muted')
      return true;
      case 'unmute':
      set(adminPingsRef, 'unmuted')
      return false;
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
}
onAuthStateChanged(auth, (user) => {
    if (user) {
      uid = user.uid;
      email = user.email
      checkAdmPings()
      //console.log(email)
      loggedInView.style.display = 'block'
      userEmail.innerText = email
      sessionStorage.setItem('email', emailSignInForm.value.replace(' ', ''));
      sessionStorage.setItem('password', passwordSignInForm.value);
      emailSignInForm.value = ""
      passwordSignInForm.value = ""
      loggedOutView.style.display = 'none'
      messageSender = email
      const refage = ref(db, `pings/${uid}`)
      const refag = ref(db, `users/${uid}`)
      get(refag).then((snapshot) => {
        set(refag, email)
        if (snapshot.val() == 'refresh') {
          logout();
        } 
      })
      const userRef = ref(db, `users`);
      get(userRef).then((snapshot) => {
        userList = snapshot.val();
      })
      let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has connected.`,
    timestamp,
  }
  const messageRef = ref(db,`messages/${uid}`)
  set(messageRef,message)
      get(refage).then((snapshot) =>{
        if (!snapshot.val()) {
          set(refage, 'x')
        }
      })
      const pingPong = ref(db, `pings/${uid}`)
onValue(pingPong,(snapshot) =>{
  const snapp = snapshot.val()
  if (snapp =='pinging' && document.visibilityState !== 'hidden') {
    set(pingPong, 'recieved')
}})
let initialized = false;
const allmessages = ref(db, "messages")
get(allmessages).then((snapshot) =>{
  Object.keys(snapshot.val()).forEach((poop) => {
    const userRef = ref(db, `messages/${poop}/text`)
    onValue(userRef, () =>{
  const reef = ref(db, `messages/${poop}`)
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
  <div class="message-sender">${message.timestamp}:          ${message.sender}</div>
  <div class="message-text">${message.text}</div>
  </div>`;
chatMessages.appendChild(newMessage);
chatMessages.scrollTop = chatMessages.scrollHeight
  }
}
const checkForPerms = async () => {
  const refage = ref(db, `AdminMan`);
  const snapshot = await get(refage);
  if (snapshot.val() == uid) {
    return true;
  } else {
    return false;
  }
};

sendBtn.addEventListener('click', async () => {
  let isAdmin = await checkForPerms(); // Await the result of checkForPerms()
  if (isAdmin && chatInput.value[0] == '/' && chatInput.value != "/tab") {
    let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      let message45 = { 
        sender: "Server",
        text: `You ran somin.`,
        timestamp,
      };
      createChatMessageElement(message45);
    let commandParts = chatInput.value.replace('/', '').split(' '); // Split command into parts
    let target = '';
      for (var i = 0; i<Object.values(userList).length; i++) {
        if (Object.values(userList)[i] == commandParts[1]) {
          target = Object.keys(userList)[i];
        }
      }
        switch (commandParts[0]) {
        case 'mute':
          if (!target) {
            alert("Please specify a user to mute.");
            return;
          }
          const muteRef = ref(db, `admpings/${uid}`);
          set(muteRef, target);
          const watcher = onValue(muteRef, (snapshot) => {  
            if (snapshot.val() === 'muted') {
              let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
              let message = {
                sender: "Server",
                text: `${target} has been muted.`,
                timestamp,
                
              };
              createChatMessageElement(message);
              off(muteRef, watcher); // Remove the listener
            }
          });
          break;
          case 'unmute':
            // let target = commandParts[1];
          if (!target) {
            alert("Please specify a user to unmute.");
            return;
          }
          set(muteRef, target);
          const watcher2 = onValue(muteRef, (snapshot) => {  
            if (snapshot.val() === 'unmuted') {
              let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
              let message = {
                sender: "Server",
                text: `${target} has been unmuted.`,
                timestamp,
                
              };
              createChatMessageElement(message);
              off(muteRef, watcher2); // Remove the listener
            }
          });
          break;
          case kick:

            if (!target) {
              alert("Please specify a user to kick.");
              return;
            }
            const kickRef = ref(db, `admpings/${uid}`);
            set(kickRef, target);
            let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message = { 
              sender: "Server",
              text: `Kick request sent to ${target}...`,
              timestamp,
              
            };
            createChatMessageElement(message);
            const watcher3 = onValue(kickRef, (snapshot) => {  
              if (snapshot.val() === 'kicked') {
                let timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
                let message = {
                  sender: "Server",
                  text: `${target} has been sucessfully kicked.`,
                  timestamp,
                  
                };
                createChatMessageElement(message);
                off(kickRef, watcher3); // Remove the listener
              }
            });
            break;
          case 'hide':
            const messageRef = ref(db, `messages/${uid}`);
            let timestamp2 = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message2 = { 
              sender: "Server",
              text: `${uid} has disconnected.`,
              timestamp2,
              
            };
            set(messageRef, message2);
            isHidden = true;
            break;
          case 'unhide':
            let timestamp3 = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message3 = { 
              sender: "Server",
              text: `${uid} has connected.`,
              timestamp3,
              
            };
            set(messageRef, message3);
            isHidden = false;
            break;
          case 'sendAs':

            let messageText = commandParts[2]; // Join the rest of the command as the message text
            if (!target || !messageText) {
              alert("Please specify a user and a message to send.");
              return;
            }
            const sendAsRef = ref(db, `messages/${uid}`);
            let timestamp4 = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
            let message4 = { 
              sender: target,
              text: messageText,
              timestamp4,
              
            };
            set(sendAsRef, message4);
            createChatMessageElement(message4);
            break;
    
          case 'help':
            let helpMessage = {
              sender: "Server",
              text: `Available commands: /tab, /mute [user], /unmute [user], /kick [user], /hide, /unhide, /sendAs [user] [message], /help`,
              timestamp,
              
            };
            createChatMessageElement(helpMessage);
            break;
      }
      chatInput.value = ""
    }
  if (chatInput.value !="/tab") {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: messageSender,
    text: chatInput.value,
    timestamp,
  }
  if (message.text) {
  const messageRef = ref(db,`messages/${uid}`)
  if (!checkAdmPings()) {
  set(messageRef,message)
  const counterRef = ref(db,'messageCount')
  get(counterRef).then((DataSnapshot) => {
    set(counterRef,DataSnapshot.val()+1)
  } )
}
  createChatMessageElement(message);  
  chatInput.value = ""
  }
} else {

  const refage = ref(db, `pings`)

  get(refage).then((snapshot) =>{
    Object.keys(snapshot.val()).forEach((poop) =>{
      const refrence = ref(db, `pings/${poop}`)
      set(refrence, 'pinging')
    })
    setTimeout(function(){
      const refage = ref(db, `pings`)
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
        const refage = ref(db, `users/${snap}`)
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