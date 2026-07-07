// post-activity.js - Phase 4: Post-Activity Guidance

import { auth, db } from './firebase-config.js';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await initializePostActivity(user);
        } else {
            window.location.href = 'login.html';
        }
    });

    // Event listeners
    document.getElementById('saveReflectionBtn')?.addEventListener('click', saveReflection);
    document.getElementById('skipReflectionBtn')?.addEventListener('click', skipReflection);
});

async function initializePostActivity(user) {
    try {
        // Get completed activity info
        const activityId = localStorage.getItem('completedActivityId');
        const activityName = localStorage.getItem('completedActivityName');

        if (activityId && activityName) {
            document.getElementById('activityNameDisplay').textContent = activityName;
        }

        // Set completion date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('completionDate').textContent = `Completed: ${today}`;

        // Load and display profile strength
        await loadProfileStrength(user.uid);

        // Check grade for milestone CTA
        await checkGradeMilestone(user.uid);

        // Get gap analysis
        await loadGapAnalysis(user.uid);

    } catch (error) {
        console.error('Error initializing post-activity:', error);
    }
}

async function loadProfileStrength(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const strength = userData?.profileStrength || 0;

        // Update strength bar
        const strengthFill = document.getElementById('strengthFill');
        const strengthPercentage = document.getElementById('strengthPercentage');

        if (strengthFill && strengthPercentage) {
            strengthFill.style.width = `${strength}%`;
            strengthPercentage.textContent = `${strength}%`;
        }

    } catch (error) {
        console.error('Error loading profile strength:', error);
    }
}

async function loadGapAnalysis(userId) {
    try {
        const activitiesSnapshot = await db.collection('users')
            .doc(userId)
            .collection('completedActivities')
            .get();

        const activities = activitiesSnapshot.docs.map(doc => doc.data());
        const gapList = document.getElementById('gapList');

        if (!gapList) return;

        // Clear existing items
        gapList.innerHTML = '';

        // Analyze gaps
        const types = activities.map(a => a.type || 'unknown');
        const hasLeadership = types.some(t => t.includes('leadership') || t.includes('volunteering'));
        const hasAcademics = types.some(t => t.includes('course') || t.includes('research'));
        const hasVolunteering = types.some(t => t.includes('volunteering'));

        let gaps = [];

        if (!hasLeadership) {
            gaps.push('You have strong academics but no leadership experience yet');
        }
        if (!hasVolunteering) {
            gaps.push('Consider adding a volunteering activity to diversify your profile');
        }
        if (activities.length < 3) {
            gaps.push('Adding more activities will strengthen your university applications');
        }

        if (gaps.length === 0) {
            gaps.push('Great work! Your profile is well-rounded.');
            gaps.push('Keep building on this momentum!');
        }

        // Add gaps to list
        gaps.forEach(gap => {
            const li = document.createElement('li');
            li.textContent = gap;
            gapList.appendChild(li);
        });

    } catch (error) {
        console.error('Error loading gap analysis:', error);
    }
}

async function checkGradeMilestone(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const grade = userData?.grade || '10';

        const milestoneCta = document.getElementById('milestoneCta');
        const milestoneMessage = document.getElementById('milestoneMessage');

        if (!milestoneCta || !milestoneMessage) return;

        if (grade === '11') {
            milestoneCta.style.display = 'block';
            milestoneMessage.textContent = 'You\'re building a strong profile. Start thinking about your university shortlist.';
        } else if (grade === '12') {
            milestoneCta.style.display = 'block';
            milestoneMessage.textContent = 'You\'re in the final stretch! Focus on your applications and deadlines.';
        } else {
            milestoneCta.style.display = 'none';
        }

    } catch (error) {
        console.error('Error checking grade milestone:', error);
    }
}

async function saveReflection() {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to save your reflection.');
            return;
        }

        const reflection1 = document.getElementById('reflection1')?.value || '';
        const reflection2 = document.getElementById('reflection2')?.value || '';
        const reflection3 = document.getElementById('reflection3')?.value || '';

        const activityId = localStorage.getItem('completedActivityId');

        // Save reflection to portfolio
        const reflectionData = {
            activityId: activityId,
            responses: [reflection1, reflection2, reflection3],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: user.uid,
            essayPotential: detectEssayPotential(reflection1, reflection2, reflection3)
        };

        await db.collection('users')
            .doc(user.uid)
            .collection('reflections')
            .add(reflectionData);

        // Update portfolio entry with reflection
        const portfolioSnapshot = await db.collection('users')
            .doc(user.uid)
            .collection('portfolio')
            .where('activityId', '==', activityId)
            .get();

        if (!portfolioSnapshot.empty) {
            const portfolioDoc = portfolioSnapshot.docs[0];
            await portfolioDoc.ref.update({
                reflectionResponses: [reflection1, reflection2, reflection3],
                essayPotentialFlag: detectEssayPotential(reflection1, reflection2, reflection3)
            });
        }

        alert('✅ Reflection saved successfully! Your portfolio has been updated.');
        
        // Redirect to portfolio
        window.location.href = 'portfolio.html';

    } catch (error) {
        console.error('Error saving reflection:', error);
        alert('There was an error saving your reflection. Please try again.');
    }
}

function skipReflection() {
    if (confirm('You can always add your reflection later. Continue to portfolio?')) {
        window.location.href = 'portfolio.html';
    }
}

function detectEssayPotential(ref1, ref2, ref3) {
    // Simple heuristic to detect if reflection has essay potential
    const allText = (ref1 + ref2 + ref3).toLowerCase();
    const keywords = ['learned', 'discovered', 'challenge', 'overcame', 'growth', 'impact', 'passion', 'future', 'leadership', 'inspire'];
    
    let score = 0;
    keywords.forEach(keyword => {
        if (allText.includes(keyword)) score++;
    });

    return score >= 3; // If at least 3 keywords found, flag for essay
}

// Export for use in other files
export { saveReflection, skipReflection };
