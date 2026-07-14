// ============================================================
// js/activity-registration.js - Phase 3 + 4 (COMPLETE)
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs, updateDoc, arrayUnion,
    onAuthStateChanged, signOut, addDoc, serverTimestamp,
    query, where, collection
} from './firebase-config.js';

console.log('🚀 activity-registration.js loaded!');

// DOM Elements
const activityNameEl = document.getElementById('activity-name');
const activityTypeEl = document.getElementById('activity-type');
const activityDurationEl = document.getElementById('activity-duration');
const activityCostEl = document.getElementById('activity-cost');
const mainDeadlineEl = document.getElementById('main-deadline');
const readinessTextEl = document.getElementById('readiness-text');
const checklistContainer = document.getElementById('checklist-container');
const markRegisteredBtn = document.getElementById('mark-registered-btn');
const completeActivityBtn = document.getElementById('completeActivityBtn');
const phase4Status = document.getElementById('phase4-status');
const completionStatus = document.getElementById('completionStatus');
const completionMessage = document.getElementById('completionMessage');
const completeActivityContainer = document.getElementById('completeActivityContainer');
const registeredBadge = document.getElementById('registeredBadge');
const phase4Section = document.getElementById('phase4Section');
const phase4Success = document.getElementById('phase4Success');

let currentActivityId = null;
let currentActivityData = null;

function getActivityIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

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

function displayActivitySummary(activity, userInterests) {
    if (activityNameEl) activityNameEl.textContent = activity.name || 'Activity';
    if (activityTypeEl) activityTypeEl.textContent = activity.type || 'General';
    if (activityDurationEl) activityDurationEl.textContent = activity.duration || 'N/A';
    if (activityCostEl) activityCostEl.textContent = activity.cost || 'Free';
    if (mainDeadlineEl) mainDeadlineEl.textContent = activity.deadline || 'Rolling';

    const interests = userInterests || ['exploration'];
    const interestString = Array.isArray(interests) ? interests.join(', ') : interests;
    if (readinessTextEl) {
        readinessTextEl.textContent = 'Based on your interest in ' + interestString + ', this activity is a great match! Complete the checklist below to register.';
    }
}

function renderChecklist(requirements) {
    if (!checklistContainer) return;
    checklistContainer.innerHTML = '';

    const defaultRequirements = [
        { id: 'personal_statement', title: 'Personal Statement', description: 'Write a short statement explaining your interest in this activity', dueDate: '2026-10-01' },
        { id: 'parent_consent', title: 'Parent/Guardian Consent', description: 'Get permission from your parents or guardian', dueDate: '2026-10-01' },
        { id: 'registration_form', title: 'Complete Registration Form', description: 'Fill out the official registration form', dueDate: '2026-10-01' }
    ];

    const reqs = requirements && requirements.length > 0 ? requirements : defaultRequirements;

    reqs.forEach(function(req, index) {
        const listItem = document.createElement('div');
        listItem.className = 'checklist-item';
        listItem.id = 'checklist-item-' + (req.id || index);
        listItem.dataset.completed = 'false';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
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

        const contentDiv = document.createElement('div');
        contentDiv.className = 'check-content';

        const label = document.createElement('label');
        label.htmlFor = 'checkbox-' + (req.id || index);
        label.textContent = (index + 1) + '. ' + (req.title || 'Requirement');

        const dueDate = document.createElement('div');
        dueDate.className = 'due-date';
        dueDate.textContent = req.dueDate ? '📅 Due: ' + req.dueDate : '';

        const desc = document.createElement('div');
        desc.className = 'desc';
        desc.textContent = req.description || '';

        contentDiv.appendChild(label);
        contentDiv.appendChild(dueDate);
        contentDiv.appendChild(desc);

        listItem.appendChild(checkbox);
        listItem.appendChild(contentDiv);
        checklistContainer.appendChild(listItem);
    });
}

function updateRegistrationButtonState() {
    if (!markRegisteredBtn) return;
    const allItems = document.querySelectorAll('.checklist-item');
    let allCompleted = true;
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

                if (registeredBadge) {
                    registeredBadge.style.display = 'block';
                }

                if (phase4Section) {
                    phase4Section.style.display = 'block';
                }

                alert('🎉 Congratulations! You have successfully registered for this activity!');

                setTimeout(function() {
                    if (phase4Section) {
                        phase4Section.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);

            } else {
                alert('You are already registered for this activity.');
                if (registeredBadge) {
                    registeredBadge.style.display = 'block';
                }
                if (phase4Section) {
                    phase4Section.style.display = 'block';
                }
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
    
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    const activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected.');
        return;
    }

    const activityName = document.getElementById('activity-name')?.textContent || 'Activity';
    const activityType = document.getElementById('activity-type')?.textContent?.toLowerCase() || 'default';
    const duration = document.getElementById('activity-duration')?.textContent || 'N/A';

    const activity = await fetchActivityData(activityId);
    const skills = activity?.skills_gained || [];

    if (completeActivityBtn) {
        completeActivityBtn.textContent = '⏳ Processing...';
        completeActivityBtn.disabled = true;
        completeActivityBtn.style.opacity = '0.6';
    }

    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", user.uid), 
            where("activityId", "==", activityId)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            alert('This activity is already in your portfolio!');
            if (completeActivityBtn) {
                completeActivityBtn.textContent = '✅ Already Completed';
                completeActivityBtn.disabled = true;
                completeActivityBtn.style.opacity = '0.6';
            }
            return;
        }

        const portfolioEntry = {
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

        await addDoc(portfolioRef, portfolioEntry);

        const userRef = doc(db, COLLECTIONS.users, user.uid);
        await updateDoc(userRef, {
            completed_activities: arrayUnion(activityId),
            lastActivityDate: new Date().toISOString()
        });

        console.log('✅ Activity marked as complete!');

        // Hide the complete button container
        if (completeActivityContainer) {
            completeActivityContainer.style.display = 'none';
        }

        // Show Phase 4 success
        if (phase4Success) {
            phase4Success.style.display = 'block';
            phase4Success.scrollIntoView({ behavior: 'smooth' });
        }

        if (phase4Status) {
            phase4Status.style.display = 'block';
            phase4Status.style.color = '#22c55e';
            phase4Status.innerHTML = '✅ Activity marked as complete! Click "Continue to Reflection" to proceed.';
        }

        localStorage.setItem('activityCompleted_' + activityId, 'true');
        localStorage.setItem('phase3Complete', 'true');

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
// GO TO REFLECTION (Phase 4)
// ============================================================

window.goToReflection = function() {
    console.log('🔵 goToReflection() called from HTML button!');
    
    const params = new URLSearchParams(window.location.search);
    let activityId = params.get('id');
    
    if (!activityId) {
        activityId = localStorage.getItem('currentActivityId');
    }
    
    if (!activityId) {
        alert('No activity selected. Please go back and select an activity.');
        window.location.href = 'student-app.html';
        return;
    }
    
    console.log('🔄 Redirecting to Phase 4 Reflection for activity:', activityId);
    
    localStorage.setItem('phase3Complete', 'true');
    localStorage.setItem('currentActivityId', activityId);
    
    window.location.href = 'post-activity.html?id=' + activityId;
};

// ============================================================
// CHECK IF ACTIVITY IS ALREADY COMPLETED
// ============================================================

async function checkIfActivityCompleted(userId, activityId) {
    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", userId), 
            where("activityId", "==", activityId)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty()) {
            if (completeActivityContainer) {
                completeActivityContainer.style.display = 'none';
            }
            if (phase4Success) {
                phase4Success.style.display = 'block';
            }
            if (phase4Status) {
                phase4Status.style.display = 'block';
                phase4Status.style.color = '#22c55e';
                phase4Status.innerHTML = '✅ This activity is already in your portfolio. Click "Continue to Reflection" to proceed.';
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
    if (completeActivityBtn) {
        console.log('🔵 Found completeActivityBtn, adding click listener');
        completeActivityBtn.addEventListener('click', markActivityAsComplete);
    } else {
        console.warn('⚠️ completeActivityBtn not found in DOM');
    }

    if (markRegisteredBtn) {
        markRegisteredBtn.addEventListener('click', function() {
            const activityId = getActivityIdFromURL();
            if (activityId) {
                handleRegistrationComplete(activityId);
            }
        });
    }

    const logoutLink = document.getElementById('logout-link');
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

    const continueBtn = document.getElementById('continue-to-phase4-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            const activityId = getActivityIdFromURL() || localStorage.getItem('currentActivityId');
            if (activityId) {
                window.location.href = 'university-shortlist.html';
            } else {
                window.location.href = 'university-shortlist.html';
            }
        });
    }
}

// ============================================================
// PHASE NAVIGATION
// ============================================================

function getCurrentPhase() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        return student.currentPhase || 3;
    } catch { return 3; }
}

function navigateToPhase(phase) {
    const phasePages = {
        1: 'quiz.html',
        2: 'student-app.html',
        3: 'activity-registration.html',
        4: 'post-activity.html',
        5: 'university-shortlist.html',
        6: 'futures-abroad-enroll.html'
    };
    window.location.href = phasePages[phase] || 'dashboard.html';
}

function renderPhaseNavigation() {
    const currentPhase = getCurrentPhase();
    const phases = [
        { num: 1, label: 'Discovery' },
        { num: 2, label: 'Activities' },
        { num: 3, label: 'Register' },
        { num: 4, label: 'Reflect' },
        { num: 5, label: 'Pathway' },
        { num: 6, label: 'Enroll' }
    ];

    let html = '';
    phases.forEach((phase, index) => {
        const isActive = phase.num <= currentPhase;
        const isCompleted = phase.num < currentPhase;
        const isCurrent = phase.num === currentPhase;

        let circleClass = 'phase-circle';
        if (isActive) circleClass += ' active';
        if (isCompleted) circleClass += ' completed';
        if (isCurrent) circleClass += ' current';

        let labelClass = 'phase-label';
        if (isActive) labelClass += ' active';

        let circleContent = phase.num;
        if (isCompleted) circleContent = '✓';

        html += `
            <div class="phase-item" onclick="navigateToPhase(${phase.num})">
                <div class="${circleClass}"><span>${circleContent}</span></div>
                <span class="${labelClass}">${phase.label}</span>
            </div>
        `;
        if (index < phases.length - 1) {
            html += `<div class="phase-connector ${phase.num < currentPhase ? 'active' : ''}"></div>`;
        }
    });

    return html;
}

function initPhaseNavigation() {
    const navContainer = document.getElementById('phase-navigation');
    if (navContainer) {
        navContainer.innerHTML = renderPhaseNavigation();
    }
}

window.navigateToPhase = navigateToPhase;

// ============================================================
// INITIALIZATION
// ============================================================

async function initApp() {
    const activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected. Please choose an activity first.');
        setTimeout(function() {
            window.location.href = 'student-app.html';
        }, 1500);
        return;
    }

    currentActivityId = activityId;

    onAuthStateChanged(auth, async function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const activity = await fetchActivityData(activityId);
        if (!activity) {
            alert('Activity not found. Please try again.');
            setTimeout(function() {
                window.location.href = 'student-app.html';
            }, 1500);
            return;
        }

        currentActivityData = activity;

        const userProfile = await getUserProfile(user.uid);
        const interests = userProfile?.interests || [];

        displayActivitySummary(activity, interests);
        renderChecklist(activity.registrationRequirements || []);
        updateRegistrationButtonState();

        const registered = userProfile?.registered_activities || [];
        if (registered.includes(activityId)) {
            if (markRegisteredBtn) {
                markRegisteredBtn.textContent = '✅ Already Registered';
                markRegisteredBtn.disabled = true;
                markRegisteredBtn.style.background = '#22c55e';
            }
            if (registeredBadge) {
                registeredBadge.style.display = 'block';
            }
            if (phase4Section) {
                phase4Section.style.display = 'block';
            }
        }

        await checkIfActivityCompleted(user.uid, activityId);
    });

    initPhaseNavigation();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing...');
    setupEventListeners();
    initApp();
});

console.log('✅ activity-registration.js initialized!');
