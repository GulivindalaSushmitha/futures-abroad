// ============================================================
// js/post-activity.js - Phase 4: Post-Activity Guidance
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, getDocs, updateDoc,
    onAuthStateChanged, signOut,
    query, where, collection
} from './firebase-config.js';

// DOM Elements
const activityNameDisplay = document.getElementById('activityNameDisplay');
const reflectionForm = document.getElementById('reflectionForm');
const saveReflectionBtn = document.getElementById('saveReflectionBtn');
const skipReflectionBtn = document.getElementById('skipReflectionBtn');
const profileStrengthFill = document.getElementById('strengthFill');
const strengthPercentage = document.getElementById('strengthPercentage');
const gapList = document.getElementById('gapList');

let currentActivityId = null;
let currentActivityName = '';

function getActivityIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadActivityData(activityId) {
    try {
        const activityRef = doc(db, COLLECTIONS.activities, activityId);
        const activityDoc = await getDoc(activityRef);
        if (activityDoc.exists()) {
            const data = activityDoc.data();
            currentActivityName = data.name || 'Activity';
            if (activityNameDisplay) {
                activityNameDisplay.textContent = currentActivityName;
            }
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error loading activity:', error);
        return null;
    }
}

async function loadProfileStrength(userId) {
    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        const count = snapshot.size;
        let strength = 0;
        
        if (count >= 5) strength = 85;
        else if (count >= 3) strength = 60;
        else if (count >= 1) strength = 35;
        else strength = 10;
        
        if (profileStrengthFill) {
            profileStrengthFill.style.width = strength + '%';
        }
        if (strengthPercentage) {
            strengthPercentage.textContent = strength + '%';
        }
        
        // Show gap analysis
        showGapAnalysis(snapshot);
        
        return strength;
    } catch (error) {
        console.error('Error loading profile strength:', error);
        return 0;
    }
}

function showGapAnalysis(portfolioSnapshot) {
    if (!gapList) return;
    
    const activities = [];
    portfolioSnapshot.forEach(doc => {
        activities.push(doc.data());
    });
    
    const types = activities.map(a => a.type || 'unknown');
    const hasLeadership = types.some(t => t === 'leadership' || t === 'volunteering' || t === 'internship');
    const hasAcademics = types.some(t => t === 'course' || t === 'research' || t === 'competition');
    const hasVolunteering = types.some(t => t === 'volunteering' || t === 'community');
    
    let gaps = [];
    
    if (!hasLeadership) {
        gaps.push('🌟 You have strong academics but no leadership experience yet');
    }
    if (!hasVolunteering) {
        gaps.push('🤝 Consider adding a volunteering activity to diversify your profile');
    }
    if (activities.length < 3) {
        gaps.push('📈 Adding more activities will strengthen your university applications');
    }
    if (activities.length > 0 && !hasAcademics) {
        gaps.push('📚 Consider adding an academic activity like a course or research');
    }
    
    if (gaps.length === 0) {
        gaps.push('🎉 Great work! Your profile is well-rounded.');
        gaps.push('💪 Keep building on this momentum!');
    }
    
    gapList.innerHTML = gaps.map(gap => 
        `<li style="padding:10px;background:#f8f9fa;margin:5px 0;border-radius:8px;border-left:4px solid #6C3CE1;">${gap}</li>`
    ).join('');
}

async function saveReflection() {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to save your reflection.');
        return;
    }

    const reflection1 = document.getElementById('reflection1')?.value || '';
    const reflection2 = document.getElementById('reflection2')?.value || '';
    const reflection3 = document.getElementById('reflection3')?.value || '';
    
    if (!reflection1 && !reflection2 && !reflection3) {
        alert('Please answer at least one reflection question before saving.');
        return;
    }

    try {
        // Find portfolio entry
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", user.uid), 
            where("activityId", "==", currentActivityId)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            alert('Portfolio entry not found. Please try again.');
            return;
        }
        
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
            reflectionResponses: [reflection1, reflection2, reflection3],
            studentNote: reflection1,
            essayPotentialFlag: (reflection1.length > 100 || reflection2.length > 100 || reflection3.length > 100)
        });

        // Also save to reflections collection
        const reflectionsRef = collection(db, 'reflections');
        await addDoc(reflectionsRef, {
            userId: user.uid,
            activityId: currentActivityId,
            activityName: currentActivityName,
            responses: [reflection1, reflection2, reflection3],
            timestamp: serverTimestamp(),
            savedAt: new Date().toISOString()
        });

        alert('✅ Reflection saved successfully! Your portfolio has been updated.');
        window.location.href = 'portfolio.html';

    } catch (error) {
        console.error('Error saving reflection:', error);
        alert('Error saving reflection. Please try again.');
    }
}

function skipReflection() {
    if (confirm('You can always add your reflection later from your portfolio. Continue?')) {
        window.location.href = 'portfolio.html';
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

async function initPostActivity() {
    const activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    currentActivityId = activityId;

    onAuthStateChanged(auth, async function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Load activity data
        await loadActivityData(activityId);
        
        // Load profile strength
        await loadProfileStrength(user.uid);
        
        // Check if user is Grade 11 for milestone
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const grade = userData.grade || '10';
            
            const milestoneCta = document.getElementById('milestoneCta');
            const milestoneMessage = document.getElementById('milestoneMessage');
            
            if (milestoneCta && milestoneMessage) {
                if (grade === '11') {
                    milestoneCta.style.display = 'block';
                    milestoneMessage.textContent = 'You\'re building a strong profile. Start thinking about your university shortlist.';
                } else if (grade === '12') {
                    milestoneCta.style.display = 'block';
                    milestoneMessage.textContent = 'You\'re in the final stretch! Focus on your applications and deadlines.';
                }
            }
        }
    });

    // Event listeners
    if (saveReflectionBtn) {
        saveReflectionBtn.addEventListener('click', saveReflection);
    }
    if (skipReflectionBtn) {
        skipReflectionBtn.addEventListener('click', skipReflection);
    }

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
    console.log('🚀 post-activity.js loaded!');
    initPostActivity();
});
