// ============================================================
// js/firebase-config.js - Firebase Configuration (COMPLETE)
// ============================================================

// Import Firebase SDKs (using v9 modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    arrayUnion,
    arrayRemove,
    query, 
    where,
    deleteDoc,
    addDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// COLLECTION NAMES - Centralized for easy reference
// ============================================================
const COLLECTIONS = {
    users: "users",
    activities: "activities",
    studentPortfolio: "studentPortfolio",    // Phase 4
    universities: "universities",            // Phase 5
    enrollments: "enrollments",              // Phase 6
    counselorTasks: "counselorTasks",        // Phase 6
    payments: "payments"                     // Phase 6
};

// ============================================================
// Export everything
// ============================================================
export { 
    // Auth
    auth, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    
    // Firestore
    db, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    arrayUnion,
    arrayRemove,
    query, 
    where,
    deleteDoc,
    addDoc,
    serverTimestamp,
    writeBatch,
    
    // Collections
    COLLECTIONS
};

console.log("🔥 Firebase initialized successfully!");
