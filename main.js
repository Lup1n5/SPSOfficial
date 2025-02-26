import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, onValue, get, DataSnapshot } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
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
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

const loggedInView = document.getElementById('logged-in-view')
const loggedOutView = document.getElementById('logged-out-view')
const userEmail = document.getElementById('user-email')
const emailSignInForm = document.getElementById('signin-email-input')
const passwordSignInForm = document.getElementById('signin-password-input')
const emailSignUpForm = document.getElementById('signup-email-input')
const passwordSignUpForm = document.getElementById('signup-password-input')
const loginBtn = document.getElementById('sign-in-btn')
const logoutBtn = document.getElementById('logout-button')
const chatMessages = document.querySelector('.chat-messages')
const chatInputForm = document.querySelector('.chat-input-form')
const chatInput = document.querySelector('.chat-input')
const sendBtn = document.querySelector(".send-button")
var messageSender = ''
var email = ""
let uid = '';
function logout() {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has disconnected.`,
    timestamp,
  }
  const messageRef = ref(db,`messages/${uid}`)
  set(messageRef,message)
  const refage = ref(db, `users/${uid}`)
      set(refage, null)
  for (var i = 0; i<chatMessages.childElementCount; i++) { 
    chatMessages.removeChild(chatMessages.firstChild); 
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
}
  
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'hidden') {
    logout();
  }
});
onAuthStateChanged(auth, (user) => {
    if (user) {
      uid = user.uid;
      email = user.email
      //console.log(email)
      loggedInView.style.display = 'block'
      userEmail.innerText = email
      emailSignInForm.value = ""
      passwordSignInForm.value = ""
      loggedOutView.style.display = 'none'
      messageSender = email
      const refage = ref(db, `users/${uid}`)
      let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has connected.`,
    timestamp,
  }
  const messageRef = ref(db,`messages/${uid}`)
  set(messageRef,message)
      set(refage, email)
         
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
sendBtn.addEventListener('click', () => {
  if (chatInput.value !="-tablist") {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: messageSender,
    text: chatInput.value,
    timestamp,
  }
  if (message.text) {
  const messageRef = ref(db,`messages/${uid}`)
  set(messageRef,message)
  const counterRef = ref(db,'messageCount')
  get(counterRef).then((DataSnapshot) => {
    set(counterRef,DataSnapshot.val()+1)
  } )
  createChatMessageElement(message);  
  chatInput.value = ""
  }
} else {
  var retern = false;
  const refage = ref(db, `users`)
  get(refage).then((snapshot) =>{
    Object.values(snapshot.val()).forEach((snap) =>{
      let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      let message = {
        sender: 'TABLIST',
        text: `${snap} is online.`,
        timestamp,
      }
      if (snap !=messageSender) {
      createChatMessageElement(message);  
      retern = true;
      }
    })
    if (retern == false) {
      let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      let message = {
        sender: 'TABLIST',
        text: `Nobody is online.`,
        timestamp,
      }
      
      createChatMessageElement(message);  
      
      
     }
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
const allmessages = ref(db, "messages")
get(allmessages).then((snapshot) =>{
  Object.keys(snapshot.val()).forEach((poop) => {
    const userRef = ref(db, `messages/${poop}/text`)
    onValue(userRef, () =>{
  const reef = ref(db, `messages/${poop}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    if (snap.sender != messageSender) {
    createChatMessageElement(snap)
    } 

  })
})

  });
})