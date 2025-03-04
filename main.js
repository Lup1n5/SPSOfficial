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
    location.reload()
  
}

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
      const refage = ref(db, `pings/${uid}`)
      const refag = ref(db, `users/${uid}`)
      set(refag, email)
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
      const pingPong = ref(db, `pings`)
onValue(pingPong,(snapshot) =>{
  const snapp = snapshot.val()
  if (snapp[uid] =='pinging' && document.visibilityState === 'hidden') {
  const pingRef = ref(db, `pings/${uid}`)
    set(pingRef, 'recieved')
}})

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
  if (chatInput.value !="/tab") {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: messageSender,
    text: chatInput.value,
    timestamp,
  }
  if (message.text) {
  const messageRef = ref(db,`messages/${uid}`)
  if (isMuted !=1){
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
