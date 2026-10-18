// Import the Firebase SDK modules from CDN (no npm/build step required)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
// Import services you need, for example Firestore:
// import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Your UI code
document.getElementById("actionBtn").addEventListener("click", () => {
  alert("Firebase initialized successfully!");
});
