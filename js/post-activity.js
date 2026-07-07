// ============================================================
// js/post-activity.js - Phase 4: Post-Activity Reflection
// ============================================================

import { 
    auth, db, COLLECTIONS,
    doc, getDoc, updateDoc, arrayUnion,
    onAuthStateChanged, signOut,
    query, where, collection, getDocs, addDoc, serverTimestamp
} from './firebase-config.js';

// DOM Elements
const activityNameDisplay = document.getElementById('activityNameDisplay');
const reflection1 = document.getElementById('reflection1');
const reflection2 = document.getElementById('reflection2');
const reflection3 = document.getElementById('reflection3');
const saveBtn = document.getElementById('saveReflectionBtn');
const skipBtn = document.getElementById('skipBtn');
const successMessage = document.getElementById('successMessage');
const reflectionForm = document.getElementById('reflectionForm');

let activityId = null;
let activityName = '';

function getActivityIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadActivity() {
    activityId = getActivityIdFromURL();
    if (!activityId) {
        alert('No activity selected.');
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const activityRef = doc(db, COLLECTIONS.activities, activityId);
        const activityDoc = await getDoc(activityRef);
        if (activityDoc.exists()) {
            const data = activityDoc.data();
            activityName = data.name || 'Activity';
            activityNameDisplay.textContent = activityName;
        } else {
            activityNameDisplay.textContent = 'Unknown Activity';
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        activityNameDisplay.textContent = 'Error loading activity';
    }
}

// Check if reflection already exists
async function checkExistingReflection(userId) {
    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", userId), 
            where("activityId", "==", activityId)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.reflectionResponses && Object.keys(data.reflectionResponses).length > 0) {
                // Pre-fill existing reflections
                reflection1.value = data.reflectionResponses.q1 || '';
                reflection2.value = data.reflectionResponses.q2 || '';
                reflection3.value = data.reflectionResponses.q3 || '';
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking existing reflection:', error);
        return false;
    }
}

// Save reflection
async function saveReflection() {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in.');
        return;
    }

    const answers = {
        q1: reflection1.value.trim(),
        q2: reflection2.value.trim(),
        q3: reflection3.value.trim()
    };

    const hasContent = answers.q1 || answers.q2 || answers.q3;
    if (!hasContent) {
        alert('Please write at least one reflection before saving, or click Skip.');
        return;
    }

    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", user.uid), 
            where("activityId", "==", activityId)
        );
        const snapshot = await getDocs(q);

        const hasEssayPotential = checkEssayPotential(answers);

        if (snapshot.empty) {
            await addDoc(portfolioRef, {
                userId: user.uid,
                activityId: activityId,
                activityName: activityName,
                dateCompleted: new Date().toISOString().split('T')[0],
                reflectionResponses: answers,
                essayPotentialFlag: hasEssayPotential,
                createdAt: serverTimestamp()
            });
        } else {
            const entryDoc = snapshot.docs[0];
            await updateDoc(doc(db, COLLECTIONS.studentPortfolio, entryDoc.id), {
                reflectionResponses: answers,
                essayPotentialFlag: hasEssayPotential
            });
        }

        const userRef = doc(db, COLLECTIONS.users, user.uid);
        await updateDoc(userRef, {
            hasReflection: true,
            lastReflectionDate: new Date().toISOString()
        });

        reflectionForm.style.display = 'none';
        successMessage.style.display = 'block';

        await updateProfileStrength(user.uid);

    } catch (error) {
        console.error('Error saving reflection:', error);
        alert('Error saving reflection. Please try again.');
    }
}

function checkEssayPotential(answers) {
    const keywords = ['learned', 'challenge', 'overcame', 'goal', 'future', 'career', 
                      'university', 'passion', 'discover', 'grow', 'develop', 'inspire',
                      'leadership', 'team', 'initiative'];
    let score = 0;
    Object.values(answers).forEach(text => {
        keywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) score++;
        });
    });
    return score >= 6;
}

async function updateProfileStrength(userId) {
    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        const activities = [];
        snapshot.forEach(doc => activities.push(doc.data()));
        
        let score = 0;
        const count = Math.min(activities.length, 5);
        score += (count / 5) * 30;
        
        const types = new Set(activities.map(a => a.type));
        score += (Math.min(types.size, 4) / 4) * 20;
        
        const hasReflections = activities.filter(a => 
            a.reflectionResponses && Object.keys(a.reflectionResponses).length > 0
        );
        const reflectionScore = Math.min(hasReflections.length / 3, 1) * 15;
        score += reflectionScore;
        
        const hasEssayPotential = activities.some(a => a.essayPotentialFlag);
        if (hasEssayPotential) score += 15;
        
        const hasLeadership = activities.some(a => 
            a.skills && a.skills.some(s => 
                ['leadership', 'initiative', 'management', 'coordinator', 'organizer'].includes(s.toLowerCase())
            )
        );
        if (hasLeadership) score += 20;
        
        const finalScore = Math.min(Math.round(score), 100);
        
        const userRef = doc(db, COLLECTIONS.users, userId);
        await updateDoc(userRef, {
            profileStrength: finalScore
        });
        
        return finalScore;
    } catch (error) {
        console.error('Error updating profile strength:', error);
        return 0;
    }
}

function skipReflection() {
    if (confirm('Are you sure you want to skip the reflection? You can always add it later from your portfolio.')) {
        reflectionForm.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.querySelector('h3').textContent = '⏭️ Reflection Skipped';
        successMessage.querySelector('p').textContent = 'You can add your reflection later from your portfolio page.';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    saveBtn?.addEventListener('click', saveReflection);
    skipBtn?.addEventListener('click', skipReflection);

    document.getElementById('logout-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        await loadActivity();
        await checkExistingReflection(user.uid);
    });
});
