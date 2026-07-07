// ============================================================
// js/activity-registration.js - Phase 3 + 4 (COMPLETE)
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove,
    onAuthStateChanged, signOut, addDoc, serverTimestamp
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
var reflectionSection = document.getElementById('reflectionSection');
var completeActivityContainer = document.getElementById('completeActivityContainer');
var goToReflectionBtn = document.getElementById('goToReflectionBtn');

// Activity data storage
var currentActivityId = null;
var currentActivityData = null;
var currentUserData = null;

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
                document.getElementById('phase4Section').style.display = 'block';
                document.getElementById('phase4Section').scrollIntoView({ behavior: 'smooth' });

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
// PHASE 4: Complete Activity & Reflection
// ============================================================

async function markActivityAsComplete() {
    var user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    var activityName = document.getElementById('activity-name')?.textContent || 'Activity';
    var activityType = document.getElementById('activity-type')?.textContent?.toLowerCase() || 'default';
    var duration = document.getElementById('activity-duration')?.textContent || 'N/A';
    var activityId = getActivityIdFromURL() || 'unknown';

    // Disable button during processing
    if (completeActivityBtn) {
        completeActivityBtn.textContent = '⏳ Processing...';
        completeActivityBtn.disabled = true;
        completeActivityBtn.style.opacity = '0.6';
    }

    try {
        // Create portfolio entry
        var portfolioEntry = {
            activityId: activityId,
            activityName: activityName,
            activityType: activityType,
            duration: duration,
            dateCompleted: new Date().toISOString().split('T')[0],
            skills: currentActivityData?.skills_gained || [],
            studentNote: '',
            reflectionResponses: [],
            essayPotentialFlag: false,
            userId: user.uid,
            timestamp: serverTimestamp()
        };

        // Add to portfolio collection
        await addDoc(collection(db, COLLECTIONS.studentPortfolio), portfolioEntry);

        // Also add to user's completed activities
        var userRef = doc(db, COLLECTIONS.users, user.uid);
        await updateDoc(userRef, {
            completed_activities: arrayUnion(activityId),
            lastActivityDate: new Date().toISOString()
        });

        // Update profile strength
        await updateProfileStrength(user.uid);

        // Show completion status
        if (completionStatus) {
            completionStatus.classList.remove('hidden');
            completionMessage.textContent = 'Activity "' + activityName + '" has been added to your portfolio!';
        }

        // Hide the complete button container
        if (completeActivityContainer) {
            completeActivityContainer.style.display = 'none';
        }

        // Show reflection section
        if (reflectionSection) {
            reflectionSection.classList.remove('hidden');
            reflectionSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Store activity info for reflection
        localStorage.setItem('completedActivityId', activityId);
        localStorage.setItem('completedActivityName', activityName);

        if (phase4Status) {
            phase4Status.style.display = 'block';
            phase4Status.style.color = '#22c55e';
            phase4Status.innerHTML = '✅ Activity marked as complete! Answer the reflection questions below to capture your experience.';
        }

    } catch (error) {
        console.error('Error completing activity:', error);
        alert('Error completing activity. Please try again.');
    } finally {
        if (completeActivityBtn) {
            completeActivityBtn.textContent = '✅ Mark Activity as Complete';
            completeActivityBtn.disabled = false;
            completeActivityBtn.style.opacity = '1';
        }
    }
}

async function updateProfileStrength(userId) {
    try {
        // Get completed activities
        var portfolioSnapshot = await getDocs(collection(db, COLLECTIONS.studentPortfolio));
        var userPortfolio = [];
        portfolioSnapshot.forEach(doc => {
            var data = doc.data();
            if (data.userId === userId) {
                userPortfolio.push(data);
            }
        });

        var count = userPortfolio.length;
        var strength = 0;

        // Factor 1: Number of activities (max 30 pts)
        if (count >= 5) strength += 30;
        else if (count >= 3) strength += 20;
        else if (count >= 1) strength += 10;

        // Factor 2: Diversity of types (max 20 pts)
        var types = new Set(userPortfolio.map(a => a.activityType));
        var typeCount = types.size;
        if (typeCount >= 4) strength += 20;
        else if (typeCount >= 3) strength += 15;
        else if (typeCount >= 2) strength += 10;
        else if (typeCount >= 1) strength += 5;

        // Factor 3: Recency (max 15 pts)
        var recent = userPortfolio.filter(a => {
            var date = new Date(a.dateCompleted);
            var now = new Date();
            var diff = (now - date) / (1000 * 60 * 60 * 24 * 30);
            return diff <= 12; // Within 12 months
        });
        if (recent.length > 0) strength += 15;

        // Factor 4: Reflection quality placeholder (max 15 pts)
        // This will be updated when reflections are saved
        strength += 10;

        // Factor 5: Leadership indicators placeholder (max 20 pts)
        var hasLeadership = userPortfolio.some(a => 
            a.activityType === 'leadership' || 
            a.activityType === 'volunteering' ||
            (a.skills && a.skills.some(s => 
                s.toLowerCase().includes('leadership') || 
                s.toLowerCase().includes('management')
            ))
        );
        if (hasLeadership) strength += 20;

        // Cap at 100
        strength = Math.min(strength, 100);

        // Update user profile
        var userRef = doc(db, COLLECTIONS.users, userId);
        await updateDoc(userRef, {
            profileStrength: strength,
            completedActivitiesCount: count
        });

        console.log('📊 Profile strength updated:', strength);

    } catch (error) {
        console.error('Error updating profile strength:', error);
    }
}

// ============================================================
// SAVE REFLECTION
// ============================================================

async function saveReflection() {
    var user = auth.currentUser;
    if (!user) {
        alert('Please log in to save your reflection.');
        return;
    }

    var reflection1 = document.getElementById('reflection1')?.value || '';
    var reflection2 = document.getElementById('reflection2')?.value || '';
    var reflection3 = document.getElementById('reflection3')?.value || '';
    var activityId = getActivityIdFromURL() || localStorage.getItem('completedActivityId');
    var activityName = document.getElementById('activity-name')?.textContent || localStorage.getItem('completedActivityName') || 'Activity';

    if (!reflection1 && !reflection2 && !reflection3) {
        alert('Please answer at least one reflection question before saving.');
        return;
    }

    try {
        // Create reflection object
        var reflectionData = {
            activityId: activityId,
            activityName: activityName,
            userId: user.uid,
            responses: [reflection1, reflection2, reflection3],
            question1: reflection1,
            question2: reflection2,
            question3: reflection3,
            essayPotential: detectEssayPotential(reflection1, reflection2, reflection3),
            timestamp: serverTimestamp(),
            savedAt: new Date().toISOString()
        };

        // Save to reflections collection
        await addDoc(collection(db, 'reflections'), reflectionData);

        // Update portfolio entry with reflection
        var portfolioSnapshot = await getDocs(collection(db, COLLECTIONS.studentPortfolio));
        portfolioSnapshot.forEach(async (doc) => {
            var data = doc.data();
            if (data.userId === user.uid && data.activityId === activityId) {
                await updateDoc(doc.ref, {
                    reflectionResponses: [reflection1, reflection2, reflection3],
                    essayPotentialFlag: detectEssayPotential(reflection1, reflection2, reflection3),
                    studentNote: reflection1 || reflection2 || reflection3
                });
            }
        });

        alert('✅ Reflection saved successfully! Your portfolio has been updated.');
        
        // Navigate to portfolio
        window.location.href = 'portfolio.html';

    } catch (error) {
        console.error('Error saving reflection:', error);
        alert('There was an error saving your reflection. Please try again.');
    }
}

function detectEssayPotential(ref1, ref2, ref3) {
    var allText = (ref1 + ref2 + ref3).toLowerCase();
    var keywords = ['learned', 'discovered', 'challenge', 'overcame', 'growth', 'impact', 'passion', 'future', 'leadership', 'inspire', 'changed', 'realized', 'goal', 'aspire'];
    
    var score = 0;
    keywords.forEach(function(keyword) {
        if (allText.includes(keyword)) score++;
    });

    return score >= 3;
}

function skipReflection() {
    if (confirm('You can always add your reflection later from your portfolio. Continue?')) {
        window.location.href = 'portfolio.html';
    }
}

// ============================================================
// SETUP PHASE 4
// ============================================================

function setupPhase4() {
    // Complete activity button
    if (completeActivityBtn) {
        completeActivityBtn.addEventListener('click', markActivityAsComplete);
    }

    // Go to reflection button
    if (goToReflectionBtn) {
        goToReflectionBtn.addEventListener('click', function() {
            if (reflectionSection) {
                reflectionSection.classList.remove('hidden');
                reflectionSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Save reflection button
    var saveBtn = document.getElementById('saveReflectionBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveReflection);
    }

    // Skip reflection button
    var skipBtn = document.getElementById('skipReflectionBtn');
    if (skipBtn) {
        skipBtn.addEventListener('click', skipReflection);
    }

    // Check if user has already completed this activity
    checkIfActivityCompleted();
}

async function checkIfActivityCompleted() {
    var user = auth.currentUser;
    if (!user) return;

    var activityId = getActivityIdFromURL();
    if (!activityId) return;

    try {
        // Check portfolio for this activity
        var portfolioSnapshot = await getDocs(collection(db, COLLECTIONS.studentPortfolio));
        var completed = false;
        portfolioSnapshot.forEach(doc => {
            var data = doc.data();
            if (data.userId === user.uid && data.activityId === activityId) {
                completed = true;
            }
        });

        if (completed) {
            // Show completion status
            if (completionStatus) {
                completionStatus.classList.remove('hidden');
                completionMessage.textContent = 'You have already completed this activity!';
            }
            if (completeActivityContainer) {
                completeActivityContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking activity completion:', error);
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

async function initPhase3() {
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

        currentActivityData = activity;

        var userProfile = await getUserProfile(user.uid);
        currentUserData = userProfile;
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
    setupPhase4();
});

console.log('✅ activity-registration.js loaded successfully!');
