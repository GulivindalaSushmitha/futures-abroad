// Phase Detection and Routing

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

        // If student hasn't completed onboarding, redirect to quiz
        if (!student.interests || student.interests.length === 0) {
            const skipPages = ['quiz.html', 'select-interests.html', 'signup.html', 'login.html', 'index.html', 'how-it-works.html'];
            if (!skipPages.includes(currentPage)) {
                window.location.href = 'quiz.html';
                return;
            }
        }

        // Check if student is on correct page for their phase
        const expectedPage = phaseToPage[currentPhase];
        const currentPhaseFromPage = pageToPhase[currentPage];

        // If on a page that's ahead of current phase, redirect to current phase
        if (currentPhaseFromPage && currentPhaseFromPage > currentPhase) {
            const skipPages = ['login.html', 'signup.html', 'index.html', 'how-it-works.html'];
            if (!skipPages.includes(currentPage)) {
                window.location.href = expectedPage || 'dashboard.html';
            }
            return;
        }

        // If on a page that's behind current phase and not login/signup
        if (currentPhaseFromPage && currentPhaseFromPage < currentPhase) {
            // Allow staying on phase 1 pages if not logged in
            if (currentPhaseFromPage === 1 && !student.name) {
                return;
            }
            // Redirect to current phase
            const skipPages = ['login.html', 'signup.html', 'index.html', 'how-it-works.html'];
            if (!skipPages.includes(currentPage)) {
                window.location.href = expectedPage || 'dashboard.html';
            }
            return;
        }
    } catch (error) {
        console.log('Phase detection error:', error);
    }
}

// Initialize phase detection
function initPhaseDetection() {
    const skipPages = ['signup.html', 'login.html', 'index.html', 'how-it-works.html', 'admin-login.html', 'admin-dashboard.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (skipPages.includes(currentPage)) {
        return;
    }
    detectAndRedirect();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectAndRedirect,
        initPhaseDetection
    };
}
