// ============================================
// PHASE DETECTION AND ROUTING
// ============================================

// Detect current phase and redirect if needed
function detectAndRedirect() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        const currentPhase = student.currentPhase || 1;
        const currentPage = window.location.pathname.split('/').pop();

        // Phase to page mapping
        const phaseToPage = {
            1: 'quiz.html',
            2: 'activities.html',
            3: 'activity-registration.html',
            4: 'post-activity.html',
            5: 'university-shortlist.html',
            6: 'futures-abroad-enroll.html'
        };

        // Page to phase mapping
        const pageToPhase = {
            'quiz.html': 1,
            'select-interests.html': 1,
            'activities.html': 2,
            'activity-registration.html': 3,
            'post-activity.html': 4,
            'phase4-final-working.html': 4,
            'phase4-test.html': 4,
            'university-shortlist.html': 5,
            'futures-abroad-enroll.html': 6
        };

        // Skip pages
        const skipPages = ['login.html', 'signup.html', 'index.html', 'how-it-works.html', 
                          'admin-login.html', 'admin-dashboard.html', 'payment-scanner.html', 
                          'payment-success.html', 'registration-complete.html', 'portfolio.html'];

        if (skipPages.includes(currentPage)) {
            return;
        }

        // If student hasn't completed onboarding, redirect to quiz
        if (!student.interests || student.interests.length === 0) {
            if (!['quiz.html', 'select-interests.html', 'signup.html'].includes(currentPage)) {
                window.location.href = 'quiz.html';
                return;
            }
            return;
        }

        // Check if student is on correct page for their phase
        const expectedPage = phaseToPage[currentPhase];
        const currentPhaseFromPage = pageToPhase[currentPage];

        // If on a page that's ahead of current phase, redirect to current phase
        if (currentPhaseFromPage && currentPhaseFromPage > currentPhase) {
            window.location.href = expectedPage || 'dashboard.html';
            return;
        }

        // If on a page that's behind current phase
        if (currentPhaseFromPage && currentPhaseFromPage < currentPhase) {
            // Allow staying on certain pages
            if (['quiz.html', 'select-interests.html'].includes(currentPage) && !student.name) {
                return;
            }
            window.location.href = expectedPage || 'dashboard.html';
            return;
        }
    } catch (error) {
        console.log('Phase detection error:', error);
    }
}

// Initialize phase detection
function initPhaseDetection() {
    const skipPages = ['signup.html', 'login.html', 'index.html', 'how-it-works.html', 
                       'admin-login.html', 'admin-dashboard.html', 'payment-scanner.html', 
                       'payment-success.html', 'registration-complete.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (skipPages.includes(currentPage)) {
        return;
    }
    detectAndRedirect();
}

// Check and transition to next phase
function transitionToNextPhase() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        const portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
        
        let transitioned = false;
        
        // Phase 3 → Phase 4: At least one completed activity
        if (student.currentPhase === 3 && student.completedActivities && student.completedActivities.length > 0) {
            student.currentPhase = 4;
            transitioned = true;
        }
        
        // Phase 4 → Phase 5: Phase 4 completed
        if (student.currentPhase === 4 && student.phase4Completed) {
            student.currentPhase = 5;
            transitioned = true;
        }
        
        // Phase 5 → Phase 6: CTA accepted
        if (student.currentPhase === 5 && student.hasAcceptedCTA) {
            student.currentPhase = 6;
            transitioned = true;
        }
        
        if (transitioned) {
            localStorage.setItem('studentProfile', JSON.stringify(student));
            // Refresh navigation
            if (typeof initPhaseNavigation === 'function') {
                initPhaseNavigation();
            }
        }
        
        return student.currentPhase;
    } catch (error) {
        console.log('Error transitioning phase:', error);
        return 1;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectAndRedirect,
        initPhaseDetection,
        transitionToNextPhase
    };
}
