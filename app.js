// Import Firebase SDK via CDN (works natively in browser without install)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// TODO: Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const form = document.getElementById("notifyForm");
const emailInput = document.getElementById("emailInput");
const submitBtn = document.getElementById("submitBtn");
const statusMsg = document.getElementById("statusMsg");

// Form submit event
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  if (!email) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  statusMsg.className = "status-msg";
  statusMsg.textContent = "";

  try {
    // Stores into a 'waitlist' collection in Firestore
    await addDoc(collection(db, "waitlist"), {
      email: email,
      createdAt: serverTimestamp()
    });

    statusMsg.className = "status-msg success";
    statusMsg.textContent = "Thanks! We will let you know when we launch.";
    emailInput.value = "";
  } catch (error) {
    console.error("Error saving email:", error);
    statusMsg.className = "status-msg error";
    statusMsg.textContent = "Something went wrong. Please try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Notify Me";
  }
});
