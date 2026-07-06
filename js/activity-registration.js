// ============================================================
// js/activity-registration.js - Phase 3 + 4
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs, updateDoc, arrayUnion,
    collection, query, where, addDoc, serverTimestamp,
    onAuthStateChanged, signOut
} from './firebase-config.js';

// ============================================================
// DOM Elements
// ============================================================
const activityNameEl = document.getElementById('activity-name');
const activityTypeEl = document.getElementById('activity-type');
const activityDurationEl = document.getElementById('activity-duration');
const mainDeadlineEl = document.getElementById('main-deadline');
const readinessTextEl = document.getElementById('readiness-text');
const checklistContainer = document.getElementById('checklist-container');
const markRegisteredBtn = document.getElementById('mark-registered-btn');

// ============================================================
// Get Activity ID from URL
// ============================================================
function getActivityIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ============================================================
// Fetch Activity from Firestore
// ============================================================
async function fetchActivityData(activityId) {
    try {
        const activityRef = doc(db, COLLECTIONS.activities, activityId);
        const activityDoc = await getDoc(activityRef);
        if (activityDoc.exists()) {
            return { id: activityDoc.id, ...activityDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching activity:', error);
        return null;
    }
}

// ============================================================
// Get User Profile
// ============================================================
async function getUserProfile(userId) {
    try {
        const userRef = doc(db, COLLECTIONS.users, userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// ============================================================
// Display Activity Summary
// ============================================================
function displayActivitySummary(activity, userInterests) {
    activityNameEl.textContent = activity.name || 'Activity';
    activityTypeEl.textContent = activity.type || 'General';
    activityDurationEl.textContent = activity.duration || 'N/A';
    mainDeadlineEl.textContent = activity.deadline || 'Rolling';

    // Personalized readiness summary
    const interests = userInterests || ['exploration'];
    const interestString = Array.isArray(interests) ? interests.join(', ') : interests;
    readinessTextEl.textContent = `Based on your interest in ${interestString}, this activity is a great match! 
        Complete the checklist below to register and start building your profile.`;
}

// ============================================================
// Render Checklist
// ============================================================
function renderChecklist(requirements) {
    checklistContainer.innerHTML = '';
    
    if (!requirements || requirements.length === 0) {
        checklistContainer.innerHTML = '<li style="padding:10px;color:#888;">No specific requirements for this activity.</li>';
        return;
    }

    requirements.forEach((req, index) => {
        const listItem = document.createElement('li');
        listItem.id = `checklist-item-${req.id || index}`;
        listItem.dataset.completed = 'false';
        listItem.style.cssText = `
            display: flex; align-items: flex-start; gap: 12px;
            padding: 12px 16px; margin-bottom: 8px;
            background: #f8f9fa; border-radius: 10px;
            border-left: 4px solid #6C3CE1;
            transition: all 0.3s;
        `;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checklist-item-checkbox';
        checkbox.id = `checkbox-${req.id || index}`;
        checkbox.style.cssText = `
            margin-top: 2px; width: 18px; height: 18px;
            cursor: pointer; accent-color: #6C3CE1;
            flex-shrink: 0;
        `;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                listItem.dataset.completed = 'true';
                listItem.style.background = '#e8f5e9';
                listItem.style.borderLeftColor = '#22c55e';
            } else {
                listItem.dataset.completed = 'false';
                listItem.style.background = '#f8f9fa';
                listItem.style.borderLeftColor = '#6C3CE1';
            }
            updateRegistrationButtonState();
        });

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'flex:1;';

        const titleSpan = document.createElement('div');
        titleSpan.style.cssText = 'font-weight:700;font-size:1rem;color:#2D1B4E;';
        titleSpan.textContent = `${index + 1}. ${req.title || 'Requirement'}`;

        const descSpan = document.createElement('div');
        descSpan.style.cssText = 'color:#666;font-size:0.9rem;margin:2px 0;';
        descSpan.textContent = req.description || '';

        const dueSpan = document.createElement('div');
        dueSpan.style.cssText = 'color:#888;font-size:0.8rem;';
        dueSpan.textContent = req.dueDate ? `📅 Due: ${req.dueDate}` : '';

        contentDiv.appendChild(titleSpan);
        contentDiv.appendChild(descSpan);
        contentDiv.appendChild(dueSpan);

        listItem.appendChild(checkbox);
        listItem.appendChild(contentDiv);
        checklistContainer.appendChild(listItem);
    });
}

// ============================================================
// Update Registration Button State
// ============================================================
function updateRegistrationButtonState() {
    const allItems = document.querySelectorAll('#checklist-container li');
    let allCompleted = true;
    allItems.forEach(item => {
        if (item.dataset.completed === 'false') {
            allCompleted = false;
        }
    });

    markRegisteredBtn.disabled = !allCompleted;
    markRegisteredBtn.textContent = allCompleted ? '✅ Mark as Registered' : 'Complete all steps to register';
    markRegisteredBtn.style.opacity = allCompleted ? '1' : '0.6';
}

// ============================================================
// Handle Registration Complete (Phase 3)
// ============================================================
async function handleRegistrationComplete(activityId) {
    if (markRegisteredBtn.disabled) return;

    const user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    try {
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const registered = userData.registered_activities || [];
            
            if (!registered.includes(activityId)) {
                await updateDoc(userRef, {
                    registered_activities: arrayUnion(activityId)
                });
                
                markRegisteredBtn.textContent = '✅ Registered!';
                markRegisteredBtn.disabled = true;
                markRegisteredBtn.style.background = '#22c55e';
                
                alert('🎉 Congratulations! You have successfully registered for this activity!');
                
                // Show Phase 4 section
                const phase4Section = document.querySelector('.phase4-section');
                if (phase4Section) {
                    phase4Section.style.display = 'block';
                }
            } else {
                alert('You are already registered for this activity.');
            }
        }
    } catch (error) {
        console.error('Error registering:', error);
        alert('Error registering. Please try again.');
    }
}

// ============================================================
// Initialize Phase 3
// ============================================================
async function initPhase3() {
    const activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected. Please choose an activity first.');
        window.location.href = 'student-app.html';
        return;
    }

    // Check if user is logged in
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Get activity data
        const activity = await fetchActivityData(activityId);
        if (!activity) {
            alert('Activity not found. Please try again.');
            window.location.href = 'student-app.html';
            return;
        }

        // Get user profile
        const userProfile = await getUserProfile(user.uid);
        const interests = userProfile?.interests || [];

        // Display
        displayActivitySummary(activity, interests);
        renderChecklist(activity.registrationRequirements || []);
        updateRegistrationButtonState();

        // Check if already registered
        const registered = userProfile?.registered_activities || [];
        if (registered.includes(activityId)) {
            markRegisteredBtn.textContent = '✅ Already Registered';
            markRegisteredBtn.disabled = true;
            markRegisteredBtn.style.background = '#22c55e';
        }

        // Event listener for registration button
        markRegisteredBtn.addEventListener('click', () => handleRegistrationComplete(activityId));
    });
}

// ============================================================
// Handle Phase 4 - Complete Activity (Imported from reflection.js)
// ============================================================
import { markActivityComplete } from './reflection.js';

// ============================================================
// Setup Phase 4 Complete Button
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const completeBtn = document.getElementById('completeActivityBtn');
    const statusEl = document.getElementById('phase4-status');
    
    if (!completeBtn) return;

    completeBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in first.');
            return;
        }

        const activityName = document.getElementById('activity-name')?.textContent || 'Activity';
        const activityType = document.getElementById('activity-type')?.textContent?.toLowerCase() || 'default';
        const duration = document.getElementById('activity-duration')?.textContent || 'N/A';
        const activityId = getActivityIdFromURL() || 'unknown';
        const note = prompt('Add a brief note about your experience (optional):');
        
        completeBtn.textContent = '⏳ Processing...';
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.6';
        
        try {
            const success = await markActivityComplete(
                activityId,
                activityName,
                activityType,
                duration,
                [],
                note || ''
            );
            
            if (success) {
                completeBtn.textContent = '✅ Completed!';
                completeBtn.style.background = '#16a34a';
                completeBtn.style.opacity = '1';
                
                if (statusEl) {
                    statusEl.style.display = 'block';
                    statusEl.style.color = '#22c55e';
                    statusEl.innerHTML = '✅ Activity marked as complete! Check your <a href="portfolio.html" style="color:#6C3CE1;font-weight:600;">portfolio</a> to see your reflections.';
                }
            } else {
                completeBtn.textContent = '✅ Mark Activity as Complete';
                completeBtn.disabled = false;
                completeBtn.style.opacity = '1';
            }
        } catch (error) {
            console.error('Error completing activity:', error);
            completeBtn.textContent = '✅ Mark Activity as Complete';
            completeBtn.disabled = false;
            completeBtn.style.opacity = '1';
            alert('Error completing activity. Please try again.');
        }
    });
});

// ============================================================
// Logout Handler
// ============================================================
document.getElementById('logout-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', initPhase3);
