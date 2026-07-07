// ============================================================
// js/reflection.js - Reflection Prompts (Phase 4)
// ============================================================

import { 
    db, auth, COLLECTIONS,
    collection, doc, getDocs, query, where,
    addDoc, updateDoc, serverTimestamp, getDoc,
    arrayUnion  // <-- THIS WAS MISSING!
} from './firebase-config.js';

// ============================================================
// Reflection Questions by Activity Type
// ============================================================
export const REFLECTION_QUESTIONS = {
    'internship': [
        'What was the most valuable skill you developed during this internship?',
        'How did this experience confirm or change your career interests?',
        'What was the biggest challenge you faced and how did you overcome it?'
    ],
    'volunteering': [
        'What impact did your work have on the community or cause?',
        'What did you learn about yourself through this experience?',
        'How will this experience influence your future goals?'
    ],
    'competition': [
        'What strategies did you use to prepare for this competition?',
        'What did you learn from the process, regardless of the outcome?',
        'How will you apply these learnings to future challenges?'
    ],
    'course': [
        'What was the most important concept you learned?',
        'How will you apply this knowledge in the future?',
        'What was the most challenging part of the course?'
    ],
    'research': [
        'What was the most interesting finding from your research?',
        'What skills did you develop during this research experience?',
        'How has this shaped your academic interests?'
    ],
    'workshop': [
        'What was the most valuable takeaway from this workshop?',
        'What new skill or knowledge will you apply immediately?',
        'What would you like to learn more about?'
    ],
    'default': [
        'What was the most meaningful part of this experience?',
        'What new skills or knowledge did you gain?',
        'How will this experience help you in the future?'
    ]
};

// ============================================================
// Show Reflection Modal
// ============================================================
export function showReflectionModal(activityId, activityName, activityType, onComplete) {
    const questions = REFLECTION_QUESTIONS[activityType] || REFLECTION_QUESTIONS.default;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'reflection-modal-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex; justify-content: center; align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    overlay.innerHTML = `
        <div style="
            background: white; 
            border-radius: 16px; 
            max-width: 600px; 
            width: 92%; 
            padding: 2rem; 
            max-height: 90vh; 
            overflow-y: auto;
            animation: slideUp 0.3s ease;
            position: relative;
        ">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
                <h2 style="margin:0;font-size:1.5rem;color:#2D1B4E;">✨ Reflect on Your Experience</h2>
                <button onclick="this.closest('.reflection-modal-overlay').remove()" 
                        style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#999;padding:0 8px;">
                    ✕
                </button>
            </div>
            <p style="color:#666;margin-bottom:1.5rem;">
                Answer these questions about <strong>${activityName}</strong> to capture your learning.
                <br><small style="color:#999;">Your reflections may be used in university essays.</small>
            </p>
            
            <form id="reflectionForm">
                ${questions.map((q, index) => `
                    <div style="margin-bottom:1.25rem;">
                        <label style="display:block;font-weight:600;margin-bottom:0.4rem;font-size:0.95rem;color:#333;">
                            ${index + 1}. ${q}
                        </label>
                        <textarea 
                            name="q${index}" 
                            style="
                                width:100%; 
                                border:1px solid #ddd; 
                                border-radius:8px; 
                                padding:0.75rem; 
                                min-height:70px; 
                                font-family:inherit;
                                font-size:0.95rem;
                                resize:vertical;
                                transition:border-color 0.3s;
                            "
                            required
                            placeholder="Write your reflection here..."
                            onfocus="this.style.borderColor='#6C3CE1'"
                            onblur="this.style.borderColor='#ddd'"
                        ></textarea>
                    </div>
                `).join('')}
                
                <div style="display:flex;gap:1rem;margin-top:1.5rem;">
                    <button type="submit" style="
                        flex:2; 
                        background:#6C3CE1; 
                        color:white; 
                        border:none; 
                        padding:0.85rem; 
                        border-radius:8px; 
                        font-weight:700; 
                        font-size:1rem;
                        cursor:pointer;
                        transition:background 0.3s;
                    "
                    onmouseover="this.style.background='#5a2db8'"
                    onmouseout="this.style.background='#6C3CE1'"
                    >
                        💾 Save Reflections
                    </button>
                    <button type="button" onclick="this.closest('.reflection-modal-overlay').remove()" style="
                        flex:1; 
                        background:#f0f0f0; 
                        color:#555; 
                        border:none; 
                        padding:0.85rem; 
                        border-radius:8px; 
                        font-weight:600;
                        cursor:pointer;
                        transition:background 0.3s;
                    "
                    onmouseover="this.style.background='#e0e0e0'"
                    onmouseout="this.style.background='#f0f0f0'"
                    >
                        Skip
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
    
    // Handle form submission
    overlay.querySelector('#reflectionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const responses = {};
        questions.forEach((q, index) => {
            const value = formData.get(`q${index}`) || '';
            responses[q] = value;
        });
        
        // Save to Firestore
        const success = await saveReflections(activityId, responses);
        
        // Close modal
        overlay.remove();
        
        if (success && onComplete) {
            onComplete();
        }
    });
}

// ============================================================
// Save Reflections to Firestore
// ============================================================
export async function saveReflections(activityId, responses) {
    const user = auth.currentUser;
    if (!user) {
        showToast('Please log in to save reflections.', 'error');
        return false;
    }
    
    try {
        // Find the portfolio entry for this activity
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", user.uid), 
            where("activityId", "==", activityId)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.error('Portfolio entry not found for activity:', activityId);
            showToast('Error: Activity not found in portfolio.', 'error');
            return false;
        }
        
        const docRef = querySnapshot.docs[0].ref;
        const currentData = querySnapshot.docs[0].data();
        
        // Merge with existing reflections
        const existingReflections = currentData.reflectionResponses || {};
        const mergedReflections = { ...existingReflections, ...responses };
        
        // Check if any response has essay potential (over 100 characters)
        const hasEssayPotential = Object.values(mergedReflections).some(text => text.length > 100);
        
        await updateDoc(docRef, {
            reflectionResponses: mergedReflections,
            essayPotentialFlag: hasEssayPotential,
            updatedAt: serverTimestamp()
        });
        
        // Also save to reflections collection
        await addDoc(collection(db, 'reflections'), {
            userId: user.uid,
            activityId: activityId,
            responses: responses,
            timestamp: serverTimestamp(),
            savedAt: new Date().toISOString()
        });
        
        // Show success message
        showToast('✅ Reflections saved! They may be used for your university essays.', 'success');
        
        return true;
        
    } catch (error) {
        console.error('Error saving reflections:', error);
        showToast('Error saving reflections. Please try again.', 'error');
        return false;
    }
}

// ============================================================
// Mark Activity as Complete (Called from registration page)
// ============================================================
export async function markActivityComplete(activityId, activityName, activityType, duration, skills, studentNote) {
    const user = auth.currentUser;
    if (!user) {
        showToast('Please log in first.', 'error');
        return false;
    }
    
    try {
        // Check if already in portfolio
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, 
            where("userId", "==", user.uid), 
            where("activityId", "==", activityId)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            showToast('This activity is already in your portfolio.', 'info');
            return true; // Return true since it's already completed
        }
        
        // Add to portfolio
        await addDoc(portfolioRef, {
            userId: user.uid,
            activityId: activityId,
            activityName: activityName,
            type: activityType || 'activity',
            duration: duration || 'N/A',
            skills: skills || [],
            studentNote: studentNote || '',
            dateCompleted: new Date().toISOString().split('T')[0],
            reflectionResponses: {},
            essayPotentialFlag: false,
            createdAt: serverTimestamp()
        });
        
        // Update user profile
        const userRef = doc(db, COLLECTIONS.users, user.uid);
        await updateDoc(userRef, {
            completed_activities: arrayUnion(activityId)
        });
        
        // Show reflection modal
        showReflectionModal(activityId, activityName, activityType, () => {
            // Refresh portfolio if on portfolio page
            if (window.location.pathname.includes('portfolio.html')) {
                window.location.reload();
            }
        });
        
        return true;
        
    } catch (error) {
        console.error('Error marking activity complete:', error);
        showToast('Error completing activity. Please try again.', 'error');
        return false;
    }
}

// ============================================================
// Toast Notification Helper
// ============================================================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        info: '#6C3CE1'
    };
    
    toast.style.cssText = `
        position: fixed; 
        bottom: 2rem; 
        right: 2rem;
        background: ${colors[type] || colors.info};
        color: white; 
        padding: 1rem 1.5rem; 
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 99999; 
        max-width: 400px;
        animation: slideUp 0.3s ease;
        font-weight: 500;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.95rem;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto dismiss
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================================
// Exports
// ============================================================
export { saveReflections, showToast };

// Make functions available globally for inline onclick handlers
window.showReflectionModal = showReflectionModal;
window.markActivityComplete = markActivityComplete;
window.showToast = showToast;
window.REFLECTION_QUESTIONS = REFLECTION_QUESTIONS;
