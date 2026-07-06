// ============================================================
// js/activity-registration.js - Phase 3 + 4 (COMPLETE)
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, updateDoc, arrayUnion,
    onAuthStateChanged, signOut
} from './firebase-config.js';

import { markActivityComplete } from './reflection.js';

// DOM Elements
var activityNameEl = document.getElementById('activity-name');
var activityTypeEl = document.getElementById('activity-type');
var activityDurationEl = document.getElementById('activity-duration');
var mainDeadlineEl = document.getElementById('main-deadline');
var readinessTextEl = document.getElementById('readiness-text');
var checklistContainer = document.getElementById('checklist-container');
var markRegisteredBtn = document.getElementById('mark-registered-btn');

function getActivityIdFromURL() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function fetchActivityData(activityId) {
    try {
        var activityRef = doc(db, COLLECTIONS.activities, activityId);
        var activityDoc = await getDoc(activityRef);
        if (activityDoc.exists()) {
            return { id: activityDoc.id, ...activityDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching activity:', error);
        return null;
    }
}

async function getUserProfile(userId) {
    try {
        var userRef = doc(db, COLLECTIONS.users, userId);
        var userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

function displayActivitySummary(activity, userInterests) {
    if (activityNameEl) activityNameEl.textContent = activity.name || 'Activity';
    if (activityTypeEl) activityTypeEl.textContent = activity.type || 'General';
    if (activityDurationEl) activityDurationEl.textContent = activity.duration || 'N/A';
    if (mainDeadlineEl) mainDeadlineEl.textContent = activity.deadline || 'Rolling';

    var interests = userInterests || ['exploration'];
    var interestString = Array.isArray(interests) ? interests.join(', ') : interests;
    if (readinessTextEl) {
        readinessTextEl.textContent = 'Based on your interest in ' + interestString + ', this activity is a great match! Complete the checklist below to register and start building your profile.';
    }
}

function renderChecklist(requirements) {
    if (!checklistContainer) return;
    checklistContainer.innerHTML = '';

    if (!requirements || requirements.length === 0) {
        checklistContainer.innerHTML = '<li style="padding:10px;color:#888;">No specific requirements for this activity.</li>';
        return;
    }

    requirements.forEach(function(req, index) {
        var listItem = document.createElement('li');
        listItem.className = 'checklist-item';
        listItem.id = 'checklist-item-' + (req.id || index);
        listItem.dataset.completed = 'false';

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.id = 'checkbox-' + (req.id || index);
        checkbox.addEventListener('change', function(e) {
            if (e.target.checked) {
                listItem.dataset.completed = 'true';
                listItem.classList.add('completed');
            } else {
                listItem.dataset.completed = 'false';
                listItem.classList.remove('completed');
            }
            updateRegistrationButtonState();
        });

        var contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        var titleSpan = document.createElement('div');
        titleSpan.className = 'title';
        titleSpan.textContent = (index + 1) + '. ' + (req.title || 'Requirement');

        var descSpan = document.createElement('div');
        descSpan.className = 'desc';
        descSpan.textContent = req.description || '';

        var dueSpan = document.createElement('div');
        dueSpan.className = 'due';
        dueSpan.textContent = req.dueDate ? '📅 Due: ' + req.dueDate : '';

        contentDiv.appendChild(titleSpan);
        contentDiv.appendChild(descSpan);
        contentDiv.appendChild(dueSpan);

        listItem.appendChild(checkbox);
        listItem.appendChild(contentDiv);
        checklistContainer.appendChild(listItem);
    });
}

function updateRegistrationButtonState() {
    if (!markRegisteredBtn) return;
    var allItems = document.querySelectorAll('.checklist-item');
    var allCompleted = true;
    allItems.forEach(function(item) {
        if (item.dataset.completed === 'false') {
            allCompleted = false;
        }
    });

    markRegisteredBtn.disabled = !allCompleted;
    markRegisteredBtn.textContent = allCompleted ? '✅ Mark as Registered' : 'Complete all steps to register';
    markRegisteredBtn.style.opacity = allCompleted ? '1' : '0.6';
}

async function handleRegistrationComplete(activityId) {
    if (!markRegisteredBtn || markRegisteredBtn.disabled) return;

    var user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    try {
        var userRef = doc(db, COLLECTIONS.users, user.uid);
        var userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            var userData = userDoc.data();
            var registered = userData.registered_activities || [];

            if (!registered.includes(activityId)) {
                await updateDoc(userRef, {
                    registered_activities: arrayUnion(activityId)
                });

                markRegisteredBtn.textContent = '✅ Registered!';
                markRegisteredBtn.disabled = true;
                markRegisteredBtn.style.background = '#22c55e';

                alert('🎉 Congratulations! You have successfully registered for this activity!');

                var phase4Section = document.querySelector('.phase4-section');
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

function setupPhase4Button() {
    var completeBtn = document.getElementById('completeActivityBtn');
    var statusEl = document.getElementById('phase4-status');
    
    if (!completeBtn) return;

    completeBtn.addEventListener('click', async function() {
        var user = auth.currentUser;
        if (!user) {
            alert('Please log in first.');
            return;
        }

        var activityName = document.getElementById('activity-name')?.textContent || 'Activity';
        var activityType = document.getElementById('activity-type')?.textContent?.toLowerCase() || 'default';
        var duration = document.getElementById('activity-duration')?.textContent || 'N/A';
        var activityId = getActivityIdFromURL() || 'unknown';
        var note = prompt('Add a brief note about your experience (optional):');
        
        completeBtn.textContent = '⏳ Processing...';
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.6';
        
        try {
            var success = await markActivityComplete(
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
                completeBtn.disabled = false;
                
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
}

async function initPhase3() {
    var activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected. Please choose an activity first.');
        window.location.href = 'student-app.html';
        return;
    }

    onAuthStateChanged(auth, async function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        var activity = await fetchActivityData(activityId);
        if (!activity) {
            alert('Activity not found. Please try again.');
            window.location.href = 'student-app.html';
            return;
        }

        var userProfile = await getUserProfile(user.uid);
        var interests = userProfile?.interests || [];

        displayActivitySummary(activity, interests);
        renderChecklist(activity.registrationRequirements || []);
        updateRegistrationButtonState();

        var registered = userProfile?.registered_activities || [];
        if (registered.includes(activityId)) {
            markRegisteredBtn.textContent = '✅ Already Registered';
            markRegisteredBtn.disabled = true;
            markRegisteredBtn.style.background = '#22c55e';
        }

        if (markRegisteredBtn) {
            markRegisteredBtn.addEventListener('click', function() {
                handleRegistrationComplete(activityId);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    initPhase3();
    setupPhase4Button();
});

console.log('✅ activity-registration.js loaded successfully!');
