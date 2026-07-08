// ============================================================
// PHASE NAVIGATION SYSTEM
// ============================================================

function getCurrentPhase() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        return student.currentPhase || 1;
    } catch {
        return 1;
    }
}

function navigateToPhase(phase) {
    const currentPhase = getCurrentPhase();
    
    if (phase > currentPhase) {
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

    let html = '<div class="phase-nav" style="display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap;">';
    phases.forEach((phase, index) => {
        const isActive = phase.num <= currentPhase;
        const isCurrent = phase.num === currentPhase;
        const isCompleted = phase.num < currentPhase;
        
        let circleContent = phase.num;
        if (isCompleted) circleContent = '✓';
        
        html += `
            <div class="phase-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}" 
                 onclick="navigateToPhase(${phase.num})" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 0 8px; min-width: 44px;">
                <div style="width: 34px; height: 34px; border-radius: 50%; background: ${isActive ? '#2563eb' : '#e2e8f0'}; display: flex; align-items: center; justify-content: center; font-weight: 700; color: ${isActive ? 'white' : '#94a3b8'}; transition: all 0.3s; font-size: 13px; border: 2px solid ${isCurrent ? '#2563eb' : 'transparent'}; box-shadow: ${isCurrent ? '0 0 0 4px rgba(37,99,235,0.25)' : 'none'};">
                    <span>${circleContent}</span>
                </div>
                <span style="font-size: 9px; color: ${isActive ? '#1e293b' : '#94a3b8'}; margin-top: 4px; font-weight: ${isActive ? '600' : '400'}; text-transform: uppercase; letter-spacing: 0.3px;">${phase.label}</span>
            </div>
        `;
        if (index < phases.length - 1) {
            html += `<div style="width: 25px; height: 2px; background: ${phase.num < currentPhase ? '#2563eb' : '#e2e8f0'}; flex-shrink: 0; transition: all 0.5s;"></div>`;
        }
    });
    html += '</div>';

    return html;
}

function initPhaseNavigation() {
    const navContainer = document.getElementById('phase-navigation');
    if (navContainer) {
        navContainer.innerHTML = renderPhaseNavigation();
    }
}
