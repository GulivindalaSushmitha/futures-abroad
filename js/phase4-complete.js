// Phase 4: Post-Activity Guidance
// This replaces post-activity.js

// Store reflection data
let currentReflection = {
    completionDate: '',
    outcomeNote: '',
    reflectionAnswers: [],
    activityId: null,
    activityName: ''
};

// Reflection prompts from spec
const REFLECTION_PROMPTS = [
    "What was the most important thing you learned?",
    "How did this activity change your perspective?",
    "What would you do differently next time?",
    "How does this connect to your future goals?"
];

// Load activity data from localStorage
function loadActivityData() {
    try {
        const saved = localStorage.getItem('selectedActivity');
        if (saved) {
            const activity = JSON.parse(saved);
            currentReflection.activityId = activity.id || 'activity_1';
            currentReflection.activityName = activity.name || 'this activity';
            const display = document.getElementById('activity-name-display');
            if (display) {
                display.textContent = currentReflection.activityName;
            }
        }
    } catch (error) {
        console.log('Error loading activity data:', error);
    }
}

// Initialize Phase 4 page
function initPhase4() {
    loadActivityData();
    renderReflectionPrompts();
    loadSavedReflection();
    loadPortfolioCount();
    
    // Initialize phase navigation
    if (typeof initPhaseNavigation === 'function') {
        initPhaseNavigation();
    }
}

// Render reflection prompts
function renderReflectionPrompts() {
    const container = document.getElementById('reflection-prompts');
    if (!container) return;

    container.innerHTML = '';
    
    REFLECTION_PROMPTS.forEach((prompt, index) => {
        const div = document.createElement('div');
        div.className = 'reflection-item';
        div.innerHTML = `
            <p class="prompt">${index + 1}. ${prompt}</p>
            <textarea 
                id="reflection-${index}" 
                placeholder="Write your reflection here..."
                rows="3"
                data-index="${index}"
            ></textarea>
        `;
        container.appendChild(div);
    });
}

// Load portfolio count
function loadPortfolioCount() {
    try {
        const portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
        const countDisplay = document.getElementById('portfolio-count');
        if (countDisplay) {
            countDisplay.textContent = portfolio.length;
        }
    } catch (error) {
        console.log('Error loading portfolio count:', error);
    }
}

// Save reflection to student portfolio
function saveReflection() {
    try {
        // Get values from form
        const completionDate = document.getElementById('completion-date')?.value || new Date().toISOString().split('T')[0];
        const outcomeNote = document.getElementById('outcome-note')?.value || '';
        
        // Get all reflection answers
        const reflectionAnswers = [];
        REFLECTION_PROMPTS.forEach((_, index) => {
            const textarea = document.getElementById(`reflection-${index}`);
            if (textarea) {
                reflectionAnswers.push(textarea.value || '');
            }
        });

        // Create portfolio entry
        const portfolioEntry = {
            id: Date.now().toString(),
            activityId: currentReflection.activityId || 'activity_1',
            activityName: currentReflection.activityName || 'Activity',
            dateCompleted: completionDate,
            outcomeNote: outcomeNote,
            reflectionResponses: reflectionAnswers,
            essayPotentialFlag: true,
            timestamp: new Date().toISOString()
        };

        // Get existing portfolio from localStorage
        let portfolio = [];
        try {
            portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
        } catch {
            portfolio = [];
        }
        portfolio.push(portfolioEntry);
        localStorage.setItem('studentPortfolio', JSON.stringify(portfolio));

        // Update student completed activities
        let student = {};
        try {
            student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        } catch {
            student = {};
        }
        if (!student.completedActivities) {
            student.completedActivities = [];
        }
        if (!student.completedActivities.includes(currentReflection.activityId)) {
            student.completedActivities.push(currentReflection.activityId);
        }
        student.phase4Completed = true;
        student.currentPhase = 4;
        localStorage.setItem('studentProfile', JSON.stringify(student));

        // Calculate profile strength
        calculateProfileStrength();

        // Show success message
        showNotification('✅ Reflection saved successfully!', 'success');

        // Show Phase 5 button
        const phase5Btn = document.getElementById('phase5-button');
        if (phase5Btn) {
            phase5Btn.style.display = 'inline-block';
        }

        // Save reflection data
        localStorage.setItem('currentReflection', JSON.stringify({
            ...currentReflection,
            completionDate,
            outcomeNote,
            reflectionAnswers
        }));

        // Update portfolio count
        loadPortfolioCount();

    } catch (error) {
        console.log('Error saving reflection:', error);
        showNotification('❌ Error saving reflection. Please try again.', 'error');
    }
}

// Calculate profile strength score
function calculateProfileStrength() {
    try {
        let portfolio = [];
        try {
            portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
        } catch {
            portfolio = [];
        }
        
        let student = {};
        try {
            student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        } catch {
            student = {};
        }
        
        let score = 0;

        // Factor 1: Number of activities (max 30 pts)
        const activityCount = Math.min(portfolio.length, 5);
        score += activityCount * 6;

        // Factor 2: Diversity (max 20 pts)
        const types = new Set();
        portfolio.forEach(e => {
            if (e.activityType) types.add(e.activityType);
        });
        score += Math.min(types.size * 5, 20);

        // Factor 3: Leadership (20 pts)
        let hasLeadership = false;
        portfolio.forEach(entry => {
            if (entry.reflectionResponses) {
                entry.reflectionResponses.forEach(response => {
                    if (response && (response.toLowerCase().includes('lead') || 
                        response.toLowerCase().includes('initiative') ||
                        response.toLowerCase().includes('organiz'))) {
                        hasLeadership = true;
                    }
                });
            }
        });
        score += hasLeadership ? 20 : 0;

        // Factor 4: Recency (15 pts)
        const recent = portfolio.some(entry => {
            if (entry.dateCompleted) {
                const date = new Date(entry.dateCompleted);
                const yearAgo = new Date();
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return date > yearAgo;
            }
            return false;
        });
        score += recent ? 15 : 0;

        // Factor 5: Reflection quality (max 15 pts)
        let totalChars = 0;
        portfolio.forEach(entry => {
            if (entry.reflectionResponses) {
                entry.reflectionResponses.forEach(response => {
                    if (response) totalChars += response.length;
                });
            }
        });
        score += Math.min(Math.floor(totalChars / 50), 15);

        student.profileStrengthScore = Math.min(score, 100);
        localStorage.setItem('studentProfile', JSON.stringify(student));

        // Display score
        const scoreDisplay = document.getElementById('profile-strength-score');
        if (scoreDisplay) {
            scoreDisplay.textContent = student.profileStrengthScore || 0;
        }
        const bar = document.getElementById('strength-bar');
        if (bar) {
            bar.style.width = (student.profileStrengthScore || 0) + '%';
        }

    } catch (error) {
        console.log('Error calculating profile strength:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {
        // Fallback alert
        alert(message);
        return;
    }

    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    container.appendChild(div);

    setTimeout(() => {
        if (div.parentNode) {
            div.remove();
        }
    }, 5000);
}

// Load saved reflection data
function loadSavedReflection() {
    try {
        const saved = localStorage.getItem('currentReflection');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.completionDate) {
                const dateInput = document.getElementById('completion-date');
                if (dateInput) dateInput.value = data.completionDate;
            }
            if (data.outcomeNote) {
                const noteInput = document.getElementById('outcome-note');
                if (noteInput) noteInput.value = data.outcomeNote;
            }
            if (data.reflectionAnswers) {
                data.reflectionAnswers.forEach((answer, index) => {
                    const textarea = document.getElementById(`reflection-${index}`);
                    if (textarea) {
                        textarea.value = answer || '';
                    }
                });
            }
        }
    } catch (error) {
        console.log('Error loading saved reflection:', error);
    }
}

// Navigate to Phase 5
function goToPhase5() {
    window.location.href = 'university-shortlist.html';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('phase4-container')) {
        initPhase4();
        
        // Save button
        const saveBtn = document.getElementById('save-reflection');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveReflection);
        }

        // Phase 5 button
        const phase5Btn = document.getElementById('phase5-button');
        if (phase5Btn) {
            phase5Btn.addEventListener('click', goToPhase5);
            // Check if already saved
            try {
                const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
                if (student.phase4Completed) {
                    phase5Btn.style.display = 'inline-block';
                }
            } catch {
                // Ignore
            }
        }
    }
});
