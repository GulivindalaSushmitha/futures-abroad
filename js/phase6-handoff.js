// ============================================
// PHASE 6: FUTURES ABROAD HANDOFF
// ============================================

// Store enrollment data
let enrollmentData = {
    program: '',
    parentEmail: '',
    counselorTimezone: 'EST',
    step: 1
};

// Initialize Phase 6
function initPhase6() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');

        // Initialize phase navigation
        if (typeof initPhaseNavigation === 'function') {
            initPhaseNavigation();
        }

        // Load student data
        displayStudentProfile(student);
        setupStepNavigation();
        setupStepProgress();
    } catch (error) {
        console.log('Error initializing Phase 6:', error);
    }
}

// Display student profile
function displayStudentProfile(student) {
    const profileContainer = document.getElementById('profile-preview');
    if (!profileContainer) return;

    let portfolio = [];
    try {
        portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
    } catch {
        portfolio = [];
    }
    
    let shortlist = { reach: [], target: [], safety: [] };
    try {
        shortlist = JSON.parse(localStorage.getItem('universityShortlist') || '{"reach":[],"target":[],"safety":[]}');
    } catch {
        shortlist = { reach: [], target: [], safety: [] };
    }

    profileContainer.innerHTML = `
        <div class="profile-details">
            <p><strong>Name:</strong> ${student.name || 'Not set'}</p>
            <p><strong>Grade:</strong> ${student.grade || 'Not set'}</p>
            <p><strong>School:</strong> ${student.school || 'Not set'}</p>
            <p><strong>Country:</strong> ${student.country || 'Not set'}</p>
            <p><strong>Interests:</strong> ${(student.interests || []).join(', ') || 'Not set'}</p>
            <p><strong>Activities Completed:</strong> ${portfolio.length}</p>
            <p><strong>Profile Strength:</strong> ${student.profileStrengthScore || 0}%</p>
            <p><strong>Universities Shortlisted:</strong> ${(shortlist.reach || []).length + (shortlist.target || []).length + (shortlist.safety || []).length}</p>
        </div>
    `;
}

// Setup step navigation
function setupStepNavigation() {
    const nextBtn = document.getElementById('next-step-btn');
    const prevBtn = document.getElementById('prev-step-btn');
    const confirmBtn = document.getElementById('confirm-enrollment');

    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', prevStep);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmEnrollment);
    }

    // Program selection
    document.querySelectorAll('.program-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.program-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            enrollmentData.program = this.dataset.program;
            const nextBtn = document.getElementById('next-step-btn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        });
    });
}

// Setup step progress dots
function setupStepProgress() {
    showStep(1);
}

// Next step
function nextStep() {
    if (enrollmentData.step === 1) {
        enrollmentData.step = 2;
        showStep(2);
    } else if (enrollmentData.step === 2) {
        if (!enrollmentData.program) {
            alert('Please select a program');
            return;
        }
        enrollmentData.step = 3;
        showStep(3);
    } else if (enrollmentData.step === 3) {
        const parentEmail = document.getElementById('parent-email')?.value;
        const timezone = document.getElementById('counselor-timezone')?.value;
        if (!parentEmail || !parentEmail.includes('@')) {
            alert('Please enter a valid parent/guardian email');
            return;
        }
        enrollmentData.parentEmail = parentEmail;
        enrollmentData.counselorTimezone = timezone || 'EST';
        enrollmentData.step = 4;
        showStep(4);
        updateSummary();
    }
}

// Previous step
function prevStep() {
    if (enrollmentData.step > 1) {
        enrollmentData.step--;
        showStep(enrollmentData.step);
    }
}

// Show specific step
function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.handoff-step').forEach(el => {
        el.style.display = 'none';
    });

    // Show current step
    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) {
        stepEl.style.display = 'block';
    }

    // Update progress dots
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 <= step);
    });

    // Show/hide navigation buttons
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const confirmBtn = document.getElementById('confirm-enrollment');

    if (prevBtn) {
        prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
    }
    if (nextBtn) {
        nextBtn.style.display = step < 4 ? 'inline-block' : 'none';
    }
    if (confirmBtn) {
        confirmBtn.style.display = step === 4 ? 'inline-block' : 'none';
    }

    // Update step counter
    const stepCounter = document.getElementById('step-counter');
    if (stepCounter) {
        stepCounter.textContent = `Step ${step} of 4`;
    }
}

// Update summary
function updateSummary() {
    const programSummary = document.getElementById('summary-program');
    if (programSummary) {
        const programNames = {
            'grade10-12': 'Grade 10-12 Track ($1,200/year)',
            'grade11-fast': 'Grade 11 Fast-Track ($1,800/year)'
        };
        programSummary.textContent = programNames[enrollmentData.program] || enrollmentData.program;
    }
    
    const emailSummary = document.getElementById('summary-email');
    if (emailSummary) {
        emailSummary.textContent = enrollmentData.parentEmail || 'Not provided';
    }
    
    const timezoneSummary = document.getElementById('summary-timezone');
    if (timezoneSummary) {
        timezoneSummary.textContent = enrollmentData.counselorTimezone || 'Not selected';
    }
}

// Confirm enrollment
function confirmEnrollment() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        const profileData = generateProfilePDF(student);
        notifyCounselor(student, profileData, enrollmentData);
        scheduleFirstSession(student);

        student.enrollmentComplete = true;
        student.currentPhase = 6;
        localStorage.setItem('studentProfile', JSON.stringify(student));

        showEnrollmentSuccess();
    } catch (error) {
        console.log('Error confirming enrollment:', error);
        alert('There was an error completing your enrollment. Please try again.');
    }
}

// Generate profile PDF (simplified)
function generateProfilePDF(student) {
    let portfolio = [];
    try {
        portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
    } catch {
        portfolio = [];
    }
    
    let shortlist = { reach: [], target: [], safety: [] };
    try {
        shortlist = JSON.parse(localStorage.getItem('universityShortlist') || '{"reach":[],"target":[],"safety":[]}');
    } catch {
        shortlist = { reach: [], target: [], safety: [] };
    }

    const profileData = {
        student: {
            name: student.name || 'Not set',
            grade: student.grade || 'Not set',
            school: student.school || 'Not set',
            country: student.country || 'Not set',
            email: student.email || 'Not set'
        },
        interests: student.interests || [],
        summary: `A ${student.grade || '10'}th grade student with interests in ${(student.interests || []).join(', ') || 'various fields'}`,
        portfolio: portfolio,
        universityShortlist: shortlist,
        profileStrength: student.profileStrengthScore || 0,
        generatedDate: new Date().toISOString()
    };

    localStorage.setItem('profilePDFData', JSON.stringify(profileData));
    console.log('📄 Profile PDF generated:', profileData);
    return profileData;
}

// Notify counselor
function notifyCounselor(student, profileData, enrollment) {
    console.log('📧 Notifying counselor:', {
        student: student.name || 'Not set',
        email: student.email || 'Not set',
        parentEmail: enrollment.parentEmail,
        timezone: enrollment.counselorTimezone,
        program: enrollment.program,
        profile: profileData
    });

    alert(`✅ Counselor has been notified!\n\nWe'll contact you at ${enrollment.parentEmail} to schedule your first session.`);
}

// Schedule first session
function scheduleFirstSession(student) {
    console.log('📅 Scheduling first session for:', student.name || 'Student');
}

// Show enrollment success
function showEnrollmentSuccess() {
    const container = document.getElementById('phase6-container');
    if (!container) return;

    container.innerHTML = `
        <div class="enrollment-success">
            <div class="success-icon">🎉</div>
            <h2>Welcome to Futures Abroad!</h2>
            <p>Your enrollment is complete. A counselor will contact you within 24 hours.</p>
            <div class="next-steps">
                <h3>What's next?</h3>
                <ul>
                    <li>Review your profile in the dashboard</li>
                    <li>Check your email for counselor introduction</li>
                    <li>Prepare for your first session</li>
                </ul>
            </div>
            <button onclick="window.location.href='dashboard.html'" class="primary-btn">
                Go to Dashboard
            </button>
        </div>
    `;

    const stepNav = document.getElementById('step-navigation');
    if (stepNav) stepNav.style.display = 'none';
    
    const stepProgress = document.querySelector('.step-progress');
    if (stepProgress) stepProgress.style.display = 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('phase6-container')) {
        initPhase6();
    }
});
