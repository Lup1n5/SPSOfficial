// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, onValue, get, DataSnapshot } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';
import { getAuth, 
         createUserWithEmailAndPassword, 
         signInWithEmailAndPassword, 
         GoogleAuthProvider,
         signInWithPopup,
         onAuthStateChanged,
         signOut } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
//hi
// Your web app's Firebase configuration
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

// logged in and logged out sections
const loggedInView = document.getElementById('logged-in-view')
const loggedOutView = document.getElementById('logged-out-view')
const userEmail = document.getElementById('user-email')

// email and password for signin
const emailSignInForm = document.getElementById('signin-email-input')
const passwordSignInForm = document.getElementById('signin-password-input')

// email and password for signup
const emailSignUpForm = document.getElementById('signup-email-input')
const passwordSignUpForm = document.getElementById('signup-password-input')

// Buttons
const signInGoogleBtn = document.getElementById('sign-in-with-google-btn')
const signUpGoogleBtn = document.getElementById('sign-up-with-google-btn')
//const googleBtns = [signInGoogleBtn, signUpGoogleBtn]

//const createAccountBtn = document.getElementById('sign-up-btn')
const loginBtn = document.getElementById('sign-in-btn')
const logoutBtn = document.getElementById('logout-button')

//const chatHeader = document.querySelector('.chat-header')
const chatMessages = document.querySelector('.chat-messages')
const chatInputForm = document.querySelector('.chat-input-form')
const chatInput = document.querySelector('.chat-input')
const sendBtn = document.querySelector(".send-button")
var messageSender = ''
var email = ""


let uid = '';
// Detects state change

onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      uid = user.uid;
      email = user.email
      //console.log(email)
      loggedInView.style.display = 'block'
      userEmail.innerText = email
      emailSignInForm.value = ""
      passwordSignInForm.value = ""
      loggedOutView.style.display = 'none'
      messageSender = email
      //console.log(messageSender);
      const refage = ref(db, `users/${uid}`)
      let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: "Server",
    text: `${messageSender} has connected.`,
    timestamp,
  }

  
  //console.log(message)
  const messageRef = ref(db,`messages/${uid}`)
  set(messageRef,message)

      set(refage, email)
      // ...
    } else {
      // User is signed out
      // ...
      
      loggedInView.style.display = 'none' 
      loggedOutView.style.display = 'block'
       
    }
  });
  // function closeIt()
  // {
  //   for (var i = 0; i<chatMessages.childElementCount; i++) { 
  //     chatMessages.removeChild(chatMessages.firstChild); 
  // }
  //   signOut(auth).then(() => {
  //     // Sign-out successful.
  //   }).catch((error) => {
  //     // An error happened.
  //   });
  // }
  // window.onbeforeunload = closeIt;

// Event Listeners for Buttons
// Click on Create Account Button


// Click on Login Button
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

    //console.log('Login Clicked')
    //console.log(`Email: ${emailSignInForm.value}`)
    ////console.log(`Password: ${passwordSignInForm.value}`)
  })
passwordSignInForm.addEventListener("keypress", function(event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    loginBtn.click();
  }
});



// logout button
logoutBtn.addEventListener('click', () => {
  // const refage = ref(db, `users/${uid}`)
  // set(refage, null)
  // const messageRef = ref(db,`messages/${uid}`)
  // set(messageRef,null)
  for (var i = 0; i<chatMessages.childElementCount; i++) { 
    chatMessages.removeChild(chatMessages.firstChild); 
}
    signOut(auth).then(() => {
        // Sign-out successful.
      }).catch((error) => {
        // An error happened.
      });
      
    //console.log('Logout Clicked')
})
const createChatMessageElement = (message) => {
  const newMessage = document.createElement("div");
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  // let string = ((timestamp - ":") - "PM") - "AM"
  let time1 = timestamp.replace(/[:APM]/g, ""); 
  let time2 = message.timestamp.replace(/[:APM]/g, ""); 
  //console.log(Number(time1))
  //console.log(Number(time2))
  //console.log(Number(time2)-Number(time1))
  if (Math.abs(Number(time2)-Number(time1)) <2) {
   
// Add some text content to the Message
newMessage.innerHTML = `<div class="message ${message.sender === messageSender ? 'blue-bg' : 'gray-bg'}">
    <div class="message-sender">${message.timestamp}:          ${message.sender}</div>
    <div class="message-text">${message.text}</div>
    
  </div>`;

// Append the Message to an existing element in the DOM
chatMessages.appendChild(newMessage);
chatMessages.scrollTop = chatMessages.scrollHeight
  }
}




sendBtn.addEventListener('click', () => {
  let timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let message = {
    sender: messageSender,
    text: chatInput.value,
    timestamp,
  }
  if (message.text) {
  //console.log(message)
  const messageRef = ref(db,`messages/${uid}`)
  set(messageRef,message)
  const counterRef = ref(db,'messageCount')
  get(counterRef).then((DataSnapshot) => {
    //console.log(DataSnapshot.val())
    set(counterRef,DataSnapshot.val()+1)
  

  } )
  
  
  //console.log(counterRef)
  createChatMessageElement(message);  
  

  ///Send message through firebase


  //Clear input field
  chatInput.value = ""

 // Scroll to bottom of chat messages
  //chatMessages.scrollTop = chatMessages.scrollHeight
  }
})
chatInput.addEventListener("keypress", function(event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    sendBtn.click();
  }
});
const allusers = ref(db, "users")
var userList = [];

get(allusers).then((snapshot) =>{
  let snap = snapshot.val()
  userList = Object.keys(snap)
  
  //console.log(userList)
  //console.log(userList.at(3))
  


const user1ref = ref(db, `messages/${userList.at(0)}/text`)
const user2ref = ref(db, `messages/${userList.at(1)}/text`)
const user3ref = ref(db, `messages/${userList.at(2)}/text`)
const user4ref = ref(db, `messages/${userList.at(3)}/text`)
const user5ref = ref(db, `messages/${userList.at(4)}/text`)
const user6ref = ref(db, `messages/${userList.at(5)}/text`)
const user7ref = ref(db, `messages/${userList.at(6)}/text`)
const user8ref = ref(db, `messages/${userList.at(7)}/text`)
onValue(user1ref, () =>{
  let reef = ref(db, `messages/${userList.at(0)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})
onValue(user2ref, () =>{
  let reef = ref(db, `messages/${userList.at(1)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})
onValue(user3ref, () =>{
  let reef = ref(db, `messages/${userList.at(2)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,

             //ear
    createChatMessageElement(snap)
    }

  })
})
onValue(user4ref, () =>{
  let reef = ref(db, `messages/${userList.at(3)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})
onValue(user5ref, () =>{
  let reef = ref(db, `messages/${userList.at(4)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})
onValue(user6ref, () =>{
  let reef = ref(db, `messages/${userList.at(5)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})
onValue(user7ref, () =>{
  let reef = ref(db, `messages/${userList.at(6)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})
onValue(user8ref, () =>{
  let reef = ref(db, `messages/${userList.at(7)}`)
  get(reef).then((snapshot) =>{
    let snap = snapshot.val()
    //console.log(snap)
    if (snap.sender != messageSender) {
      //,
             
    createChatMessageElement(snap)
    }

  })
})

})











//haha 69
