// ============================================================
// js/activity-registration.js - Phase 3 + 4 (COMPLETE)
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove,
    onAuthStateChanged, signOut, addDoc, serverTimestamp,
    query, where, collection
} from './firebase-config.js';

// DOM Elements
var activityNameEl = document.getElementById('activity-name');
var activityTypeEl = document.getElementById('activity-type');
var activityDurationEl = document.getElementById('activity-duration');
var activityCostEl = document.getElementById('activity-cost');
var mainDeadlineEl = document.getElementById('main-deadline');
var readinessTextEl = document.getElementById('readiness-text');
var checklistContainer = document.getElementById('checklist-container');
var markRegisteredBtn = document.getElementById('mark-registered-btn');
var completeActivityBtn = document.getElementById('completeActivityBtn');
var phase4Status = document.getElementById('phase4-status');
var completionStatus = document.getElementById('completionStatus');
var completionMessage = document.getElementById('completionMessage');
var completeActivityContainer = document.getElementById('completeActivityContainer');

var currentActivityId = null;

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
    if (activityCostEl) activityCostEl.textContent = activity.cost || 'Free';
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

                // Show Phase 4 section
                var phase4Section = document.getElementById('phase4Section');
                if (phase4Section) {
                    phase4Section.style.display = 'block';
                    phase4Section.scrollIntoView({ behavior: 'smooth' });
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
// PHASE 4: Mark Activity as Complete
// ============================================================

async function markActivityAsComplete() {
    console.log('🔵 Complete Activity button clicked!');
    
    var user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    var activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected.');
        return;
    }

    var activityName = document.getElementById('activity-name')?.textContent || 'Activity';
    var activityType = document.getElementById('activity-type')?.textContent?.toLowerCase() || 'default';
    var duration = document.getElementById('activity-duration')?.textContent || 'N/A';

    // Get activity data for skills
    var activity = await fetchActivityData(activityId);
    var skills = activity?.skills_gained || [];

    // Disable button during processing
    if (completeActivityBtn) {
        completeActivityBtn.textContent = '⏳ Processing...';
        completeActivityBtn.disabled = true;
        completeActivityBtn.style.opacity = '0.6';
    }

    try {
        // Create portfolio entry
        var portfolioEntry = {
            userId: user.uid,
            activityId: activityId,
            activityName: activityName,
            type: activityType,
            duration: duration,
            skills: skills,
            studentNote: '',
            dateCompleted: new Date().toISOString().split('T')[0],
            reflectionResponses: {},
            essayPotentialFlag: false,
            createdAt: serverTimestamp()
        };

        // Add to portfolio collection
        var portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        await addDoc(portfolioRef, portfolioEntry);

        // Update user profile
        var userRef = doc(db, COLLECTIONS.users, user.uid);
        await updateDoc(userRef, {
            completed_activities: arrayUnion(activityId),
            lastActivityDate: new Date().toISOString()
        });

        console.log('✅ Activity marked as complete!');

        // Show completion status
        if (completionStatus) {
            completionStatus.classList.remove('hidden');
            if (completionMessage) {
                completionMessage.textContent = 'Activity "' + activityName + '" has been added to your portfolio!';
            }
        }

        // Hide the complete button container
        if (completeActivityContainer) {
            completeActivityContainer.style.display = 'none';
        }

        // Show Phase 4 status
        if (phase4Status) {
            phase4Status.style.display = 'block';
            phase4Status.style.color = '#22c55e';
            phase4Status.innerHTML = '✅ Activity marked as complete! Redirecting to Phase 4...';
        }

        // Redirect to Phase 4 page (post-activity.html)
        setTimeout(function() {
            window.location.href = 'post-activity.html?id=' + activityId;
        }, 1500);

    } catch (error) {
        console.error('❌ Error completing activity:', error);
        alert('Error completing activity: ' + error.message);
        if (completeActivityBtn) {
            completeActivityBtn.textContent = '✅ Mark Activity as Complete';
            completeActivityBtn.disabled = false;
            completeActivityBtn.style.opacity = '1';
        }
    }
}

// ============================================================
// CHECK IF ACTIVITY IS ALREADY COMPLETED
// ============================================================

async function checkIfActivityCompleted(userId, activityId) {
    try {
        var portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        var q = query(portfolioRef, 
            where("userId", "==", userId), 
            where("activityId", "==", activityId)
        );
        var snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // Activity is already completed
            if (completionStatus) {
                completionStatus.classList.remove('hidden');
                if (completionMessage) {
                    completionMessage.textContent = 'You have already completed this activity!';
                }
            }
            if (completeActivityContainer) {
                completeActivityContainer.style.display = 'none';
            }
            if (phase4Status) {
                phase4Status.style.display = 'block';
                phase4Status.style.color = '#22c55e';
                phase4Status.innerHTML = '✅ This activity is already in your portfolio. <a href="portfolio.html" style="color:#6C3CE1;font-weight:600;">View Portfolio</a>';
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking activity completion:', error);
        return false;
    }
}

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    // Complete activity button
    if (completeActivityBtn) {
        console.log('🔵 Found completeActivityBtn, adding click listener');
        completeActivityBtn.addEventListener('click', markActivityAsComplete);
    } else {
        console.warn('⚠️ completeActivityBtn not found in DOM');
    }

    // Mark registered button
    if (markRegisteredBtn) {
        markRegisteredBtn.addEventListener('click', function() {
            var activityId = getActivityIdFromURL();
            if (activityId) {
                handleRegistrationComplete(activityId);
            }
        });
    }

    // Logout
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
}

// ============================================================
// INITIALIZATION
// ============================================================

async function initApp() {
    var activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected. Please choose an activity first.');
        window.location.href = 'student-app.html';
        return;
    }

    currentActivityId = activityId;

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
            if (markRegisteredBtn) {
                markRegisteredBtn.textContent = '✅ Already Registered';
                markRegisteredBtn.disabled = true;
                markRegisteredBtn.style.background = '#22c55e';
            }
            // Show Phase 4 section
            var phase4Section = document.getElementById('phase4Section');
            if (phase4Section) {
                phase4Section.style.display = 'block';
            }
        }
        
        // Check if activity is already completed
        await checkIfActivityCompleted(user.uid, activityId);
    });
}

// ============================================================
// START APP
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 activity-registration.js loaded!');
    setupEventListeners();
    initApp();
});

console.log('✅ activity-registration.js initialized!');
