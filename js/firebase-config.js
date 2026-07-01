// ============================================================
// js/firebase-config.js - Firebase Configuration
// YOUR FREE API KEY IS INCLUDED
// ============================================================

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGJcOifwfWlGeFsFCXhdC67fyRTBOvfGQ",
  authDomain: "futures-2.firebaseapp.com",
  projectId: "futures-2",
  storageBucket: "futures-2.firebasestorage.app",
  messagingSenderId: "143399880838",
  appId: "1:143399880838:web:c2232759fcbc1fa2ed2907"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth and db available globally
const auth = firebase.auth();
const db = firebase.firestore();

// Admin credentials (YOURS ONLY)
const ADMIN_EMAIL = "admin@futuresabroad.com";
const ADMIN_PASSWORD = "FuturesAdmin2026!";
const ADMIN_UID = "hrONkvAlxVac4Wc7nwdNLhdOIe33"; // ADD THIS LINE

console.log("🔥 Firebase initialized successfully!");
console.log("📁 Project ID:", firebaseConfig.projectId);
