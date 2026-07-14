// js/auth.js - Complete Authentication System
// ============================================================

import { 
    auth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    db,
    doc,
    setDoc,
    getDoc,
    COLLECTIONS
} from './firebase-config.js';

// ============================================================
// LOGIN FUNCTION
// ============================================================
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        const userDoc = await getDoc(userRef);
        
        let userData = {
            uid: user.uid,
            email: user.email,
            name: user.email?.split('@')[0] || 'Student',
            grade: 10,
            interests: ['STEM', 'Leadership'],
            loggedIn: true
        };
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            userData = {
                ...userData,
                ...data,
                loggedIn: true
            };
        } else {
            // Create profile if it doesn't exist
            await setDoc(userRef, userData);
        }
        
        // Save to localStorage
        localStorage.setItem('futuresAbroadUser', JSON.stringify(userData));
        
        return { success: true, user: userData };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// SIGNUP FUNCTION
// ============================================================
export async function signupUser(email, password, userData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userProfile = {
            uid: user.uid,
            email: user.email,
            name: userData.name || user.email?.split('@')[0] || 'Student',
            grade: userData.grade || 10,
            interests: userData.interests || ['STEM', 'Leadership'],
            school: userData.school || '',
            country: userData.country || '',
            createdAt: new Date().toISOString(),
            loggedIn: true
        };
        
        // Save to Firestore
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        await setDoc(userRef, userProfile);
        
        // Save to localStorage
        localStorage.setItem('futuresAbroadUser', JSON.stringify(userProfile));
        
        return { success: true, user: userProfile };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// LOGOUT FUNCTION
// ============================================================
export async function logoutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('futuresAbroadUser');
        localStorage.removeItem('selectedActivity');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// CHECK AUTH STATE
// ============================================================
export function checkAuthState(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in
            const userRef = doc(db, COLLECTIONS.users, user.uid);
            const userDoc = await getDoc(userRef);
            
            let userData = {
                uid: user.uid,
                email: user.email,
                name: user.email?.split('@')[0] || 'Student',
                grade: 10,
                interests: ['STEM', 'Leadership'],
                loggedIn: true
            };
            
            if (userDoc.exists()) {
                userData = { ...userData, ...userDoc.data(), loggedIn: true };
            }
            
            localStorage.setItem('futuresAbroadUser', JSON.stringify(userData));
            callback(userData);
        } else {
            // User is logged out
            localStorage.removeItem('futuresAbroadUser');
            callback(null);
        }
    });
}

// ============================================================
// GET CURRENT USER
// ============================================================
export function getCurrentUser() {
    const userData = localStorage.getItem('futuresAbroadUser');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ============================================================
// UPDATE USER PROFILE
// ============================================================
export async function updateUserProfile(updates) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'Not logged in' };
    }
    
    try {
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        await setDoc(userRef, updates, { merge: true });
        
        // Update localStorage
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem('futuresAbroadUser', JSON.stringify(updatedUser));
        }
        
        return { success: true };
    } catch (error) {
        console.error('Update error:', error);
        return { success: false, error: error.message };
    }
}
