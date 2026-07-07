// ============================================================
// js/dashboard.js - User Dashboard (COMPLETE)
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs,
    onAuthStateChanged, signOut,
    query, where, collection
} from './firebase-config.js';

// DOM Elements
const userNameEl = document.getElementById('userName');
const gradeBadge = document.getElementById('gradeBadge');
const strengthFill = document.getElementById('strengthFill');
const strengthPercent = document.getElementById('strengthPercent');
const strengthText = document.getElementById('strengthText');
const activityCountEl = document.getElementById('activityCount');
const recentActivitiesEl = document.getElementById('recentActivities');
const currentPhaseEl = document.getElementById('currentPhase');
const phaseSteps = document.querySelectorAll('.phase-step');

// ============================================================
// NAVIGATION FUNCTIONS
// ============================================================

window.goToPhase = function(phaseNumber) {
    const phaseMap = {
        1: 'student-app.html',
        2: 'student-app.html',
        3: 'activity-registration.html',
        4: 'post-activity.html',
        5: 'university-shortlist.html',
        6: 'futures-abroad-enroll.html'
    };
    
    const url = phaseMap[phaseNumber] || 'dashboard.html';
    window.location.href = url;
};

// ============================================================
// LOAD USER DATA
// ============================================================

async function loadUserData(userId) {
    try {
        const userRef = doc(db, COLLECTIONS.users, userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Display user info
            if (userNameEl) userNameEl.textContent = data.name || 'Student';
            if (gradeBadge) gradeBadge.textContent = 'Grade ' + (data.grade || '10');
            
            // Load portfolio and phase
            await loadPortfolioData(userId);
            await loadPhaseInfo(data.grade || '10');
            await updatePhaseProgress(data.grade || '10');
            
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}

// ============================================================
// LOAD PORTFOLIO DATA
// ============================================================

async function loadPortfolioData(userId) {
    try {
        // Get portfolio entries
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        const activities = [];
        snapshot.forEach(doc => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        
        // Update activity count
        if (activityCountEl) {
            activityCountEl.textContent = activities.length;
        }
        
        // Calculate profile strength
        const strength = calculateProfileStrength(activities);
        
        if (strengthFill) {
            strengthFill.style.width = strength + '%';
        }
        if (strengthPercent) {
            strengthPercent.textContent = strength + '%';
        }
        if (strengthText) {
            if (strength >= 80) strengthText.textContent = '🎯 University Ready!';
            else if (strength >= 60) strengthText.textContent = '🏆 Competitive Candidate';
            else if (strength >= 40) strengthText.textContent = '⭐ Strong Profile';
            else if (strength >= 20) strengthText.textContent = '📈 Building Momentum';
            else strengthText.textContent = '🌱 Just Getting Started';
        }
        
        // Show recent activities
        renderRecentActivities(activities);
        
        return activities;
    } catch (error) {
        console.error('Error loading portfolio:', error);
        return [];
    }
}

// ============================================================
// CALCULATE PROFILE STRENGTH
// ============================================================

function calculateProfileStrength(activities) {
    if (!activities || activities.length === 0) return 0;
    
    let score = 0;
    const now = new Date();
    
    // Factor 1: Number of activities (max 30 pts)
    const count = Math.min(activities.length, 5);
    score += (count / 5) * 30;
    
    // Factor 2: Diversity of types (max 20 pts)
    const types = new Set(activities.map(a => a.type));
    const typeCount = Math.min(types.size, 4);
    score += (typeCount / 4) * 20;
    
    // Factor 3: Leadership indicators (max 20 pts)
    const hasLeadership = activities.some(a => 
        a.skills && a.skills.some(s => 
            ['leadership', 'initiative', 'management', 'coordinator', 'organizer'].includes(s.toLowerCase())
        )
    );
    if (hasLeadership) score += 20;
    
    // Factor 4: Recency (max 15 pts)
    const recentActivities = activities.filter(a => {
        if (!a.dateCompleted) return false;
        const completed = new Date(a.dateCompleted);
        const monthsDiff = (now - completed) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff <= 12;
    });
    const recencyScore = Math.min(recentActivities.length / 3, 1) * 15;
    score += recencyScore;
    
    // Factor 5: Reflection quality (max 15 pts)
    const hasReflections = activities.filter(a => 
        a.reflectionResponses && Object.keys(a.reflectionResponses).length > 0
    );
    const reflectionScore = Math.min(hasReflections.length / 3, 1) * 15;
    score += reflectionScore;
    
    // Bonus: Essay potential
    const hasEssayPotential = activities.some(a => a.essayPotentialFlag);
    if (hasEssayPotential) score += 5;
    
    return Math.round(Math.min(score, 100));
}

// ============================================================
// RENDER RECENT ACTIVITIES
// ============================================================

function renderRecentActivities(activities) {
    if (!recentActivitiesEl) return;
    
    const sorted = activities.sort((a, b) => {
        return new Date(b.dateCompleted || 0) - new Date(a.dateCompleted || 0);
    });
    
    const recent = sorted.slice(0, 5);
    
    if (recent.length === 0) {
        recentActivitiesEl.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔍</div>
                <p>No activities yet. <a href="student-app.html" style="color:#6C3CE1;font-weight:600;">Find your first activity →</a></p>
            </div>
        `;
        return;
    }
    
    recentActivitiesEl.innerHTML = recent.map(activity => `
        <div class="activity-item">
            <div>
                <div class="name">${activity.activityName || 'Activity'}</div>
                <div style="font-size:13px;color:#888;">${activity.type || 'General'}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <span class="date">${activity.dateCompleted || 'N/A'}</span>
                <span class="status completed">✅ Completed</span>
            </div>
        </div>
    `).join('');
}

// ============================================================
// LOAD PHASE INFO
// ============================================================

function loadPhaseInfo(grade) {
    if (!currentPhaseEl) return;
    
    const phaseMap = {
        '10': {
            phase: 'Phase 1-2',
            name: 'Discovery & Exploration',
            description: 'Complete your profile and discover activities that match your interests.',
            icon: '🔍'
        },
        '11': {
            phase: 'Phase 5',
            name: 'University Pathway',
            description: 'Build your university shortlist and get ready for applications.',
            icon: '🏛️'
        },
        '12': {
            phase: 'Phase 6',
            name: 'Application Ready',
            description: 'Prepare your applications and essays with expert guidance.',
            icon: '📝'
        }
    };
    
    const phase = phaseMap[grade] || phaseMap['10'];
    
    currentPhaseEl.innerHTML = `
        <div style="background:#f8f4ff;padding:16px;border-radius:12px;border-left:4px solid #6C3CE1;">
            <div style="font-size:28px;">${phase.icon}</div>
            <h4 style="margin:5px 0;color:#2D1B4E;">${phase.phase}: ${phase.name}</h4>
            <p style="color:#666;font-size:14px;margin:0;">${phase.description}</p>
        </div>
    `;
}

// ============================================================
// UPDATE PHASE PROGRESS
// ============================================================

async function updatePhaseProgress(grade) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Get completed activities
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const completedCount = snapshot.size;
        
        // Determine phases completed
        let phasesCompleted = 0;
        
        // Phase 1 & 2: Always completed if user has profile
        phasesCompleted = 2;
        
        // Phase 3: Completed if registered for at least one activity
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        const userDoc = await getDoc(userRef);
        const registered = userDoc.exists() ? userDoc.data().registered_activities || [] : [];
        if (registered.length > 0) phasesCompleted = 3;
        
        // Phase 4: Completed if at least one reflection saved
        const hasReflection = snapshot.docs.some(doc => {
            const data = doc.data();
            return data.reflectionResponses && Object.keys(data.reflectionResponses).length > 0;
        });
        if (hasReflection) phasesCompleted = 4;
        
        // Phase 5: Check if university shortlist viewed
        // We'll track this via local storage or a flag
        const hasViewedUniversities = localStorage.getItem('viewedUniversities') === 'true';
        if (hasViewedUniversities) phasesCompleted = 5;
        
        // Phase 6: Check if enrolled
        const isEnrolled = userDoc.exists() ? userDoc.data().status === 'futures_abroad_enrolled' : false;
        if (isEnrolled) phasesCompleted = 6;
        
        // Update UI
        phaseSteps.forEach((step, index) => {
            const phaseNum = index + 1;
            step.classList.remove('completed', 'active');
            
            if (phaseNum <= phasesCompleted) {
                step.classList.add('completed');
            } else if (phaseNum === phasesCompleted + 1) {
                step.classList.add('active');
            }
        });
        
    } catch (error) {
        console.error('Error updating phase progress:', error);
    }
}

// ============================================================
// MARK UNIVERSITY SHORTLIST VIEWED
// ============================================================

// This function is called from university-shortlist.html
window.markUniversitiesViewed = function() {
    localStorage.setItem('viewedUniversities', 'true');
};

// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

async function initDashboard() {
    onAuthStateChanged(auth, async function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        await loadUserData(user.uid);
    });

    // Logout
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            await logoutUser();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard loaded!');
    initDashboard();
});

// Make functions globally available
window.logoutUser = logoutUser;
window.updatePhaseProgress = updatePhaseProgress;

console.log('✅ dashboard.js initialized!');
