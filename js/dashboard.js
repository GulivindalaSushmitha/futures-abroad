// ============================================================
// js/dashboard.js - User Dashboard
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs, updateDoc,
    onAuthStateChanged, signOut,
    query, where, collection
} from './firebase-config.js';

// DOM Elements
const userNameEl = document.getElementById('userName');
const userGradeEl = document.getElementById('userGrade');
const userSchoolEl = document.getElementById('userSchool');
const userCountryEl = document.getElementById('userCountry');
const profileStrengthFill = document.getElementById('profileStrengthFill');
const strengthPercentage = document.getElementById('strengthPercentage');
const activityCountEl = document.getElementById('activityCount');
const recentActivitiesEl = document.getElementById('recentActivities');
const currentPhaseEl = document.getElementById('currentPhase');

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
            if (userGradeEl) userGradeEl.textContent = 'Grade ' + (data.grade || '10');
            if (userSchoolEl) userSchoolEl.textContent = data.school || 'Not specified';
            if (userCountryEl) userCountryEl.textContent = data.country || 'Not specified';
            
            // Load portfolio
            await loadPortfolioData(userId);
            
            // Load phase info
            loadPhaseInfo(data.grade || '10');
            
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
        let strength = 0;
        if (activities.length >= 5) strength = 85;
        else if (activities.length >= 3) strength = 60;
        else if (activities.length >= 1) strength = 35;
        else strength = 10;
        
        if (profileStrengthFill) {
            profileStrengthFill.style.width = strength + '%';
        }
        if (strengthPercentage) {
            strengthPercentage.textContent = strength + '%';
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
            <div style="text-align:center;padding:20px;color:#888;">
                <p>No activities completed yet.</p>
                <a href="student-app.html" class="btn-primary" style="margin-top:10px;padding:10px 20px;font-size:14px;">
                    🎯 Find Activities
                </a>
            </div>
        `;
        return;
    }
    
    recentActivitiesEl.innerHTML = recent.map(activity => `
        <div style="background:#f8f9fa;padding:12px 16px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">
            <div>
                <strong style="color:#2D1B4E;">${activity.activityName || 'Activity'}</strong>
                <span style="color:#888;font-size:0.9rem;margin-left:10px;">${activity.type || 'General'}</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <span style="color:#666;font-size:0.85rem;">✅ ${activity.dateCompleted || 'Completed'}</span>
                <a href="portfolio.html" style="color:#6C3CE1;font-size:0.85rem;text-decoration:none;">View →</a>
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
        <div style="background:#f8f4ff;padding:20px;border-radius:12px;border-left:4px solid #6C3CE1;">
            <div style="font-size:32px;">${phase.icon}</div>
            <h3 style="margin:5px 0;color:#2D1B4E;">${phase.phase}: ${phase.name}</h3>
            <p style="color:#666;margin:0;">${phase.description}</p>
        </div>
    `;
}

// ============================================================
// UPDATE USER GRADE (Called from settings)
// ============================================================

async function updateUserGrade(grade) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        await updateDoc(userRef, { grade: grade });
        localStorage.setItem('studentGrade', grade);
        loadPhaseInfo(grade);
        alert('✅ Grade updated successfully!');
    } catch (error) {
        console.error('Error updating grade:', error);
        alert('Error updating grade. Please try again.');
    }
}

// ============================================================
// NAVIGATION FUNCTIONS
// ============================================================

function goToPhase(phaseNumber) {
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
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard loaded!');
    initDashboard();
});

// Make functions globally available
window.updateUserGrade = updateUserGrade;
window.goToPhase = goToPhase;
