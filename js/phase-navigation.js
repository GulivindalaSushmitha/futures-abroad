// Phase Navigation System

// Get current phase from localStorage
function getCurrentPhase() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        return student.currentPhase || 1;
    } catch {
        return 1;
    }
}

// Update phase navigation display
function updatePhaseNavigation() {
    const currentPhase = getCurrentPhase();
    const dots = document.querySelectorAll('.phase-dot');
    const lines = document.querySelectorAll('.phase-line');

    dots.forEach((dot, index) => {
        const phaseNum = index + 1;
        dot.classList.toggle('active', phaseNum <= currentPhase);
        dot.classList.toggle('completed', phaseNum < currentPhase);
    });

    lines.forEach((line, index) => {
        const phaseNum = index + 1;
        line.classList.toggle('active', phaseNum < currentPhase);
    });
}

// Navigate to a phase
function navigateToPhase(phase) {
    const currentPhase = getCurrentPhase();
    
    // Can only navigate to completed or current phase
    if (phase > currentPhase) {
        // Redirect to current phase page
        const phasePages = {
            1: 'quiz.html',
            2: 'activities.html',
            3: 'activity-registration.html',
            4: 'post-activity.html',
            5: 'university-shortlist.html',
            6: 'futures-abroad-enroll.html'
        };
        window.location.href = phasePages[currentPhase] || 'dashboard.html';
        return;
    }

    // Navigate to requested phase
    const phasePages = {
        1: 'quiz.html',
        2: 'activities.html',
        3: 'activity-registration.html',
        4: 'post-activity.html',
        5: 'university-shortlist.html',
        6: 'futures-abroad-enroll.html'
    };
    window.location.href = phasePages[phase] || 'dashboard.html';
}

// Render phase navigation HTML
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

    let html = '<div class="phase-nav">';
    phases.forEach((phase, index) => {
        const isActive = phase.num <= currentPhase;
        const isCurrent = phase.num === currentPhase;
        html += `
            <div class="phase-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}" 
                 onclick="navigateToPhase(${phase.num})">
                <div class="phase-circle">${phase.num}</div>
                <span class="phase-label">${phase.label}</span>
            </div>
        `;
        if (index < phases.length - 1) {
            html += `<div class="phase-connector ${phase.num < currentPhase ? 'active' : ''}"></div>`;
        }
    });
    html += '</div>';

    return html;
}

// Initialize phase navigation
function initPhaseNavigation() {
    const navContainer = document.getElementById('phase-navigation');
    if (navContainer) {
        navContainer.innerHTML = renderPhaseNavigation();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentPhase,
        updatePhaseNavigation,
        navigateToPhase,
        renderPhaseNavigation,
        initPhaseNavigation
    };
}
