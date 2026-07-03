// ============================================================
// js/student-app.js - Complete Phases 1, 2, 3
// (Updated for Beautiful Design)
// ============================================================

import { 
    auth, 
    db, 
    onAuthStateChanged,
    signOut,
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    arrayUnion,
    query, 
    where,
    serverTimestamp
} from './firebase-config.js';

// ========================================
// STATE
// ========================================
const state = {
    user: null,
    studentProfile: null,
    interests: [],
    currentQuestion: 0,
    selectedActivity: null,
    registeredActivities: [],
    allActivities: [],
    filteredActivities: []
};

// ========================================
// QUIZ DATA (Phase 1)
// ========================================
const quizQuestions = [
    {
        question: "What subject do you look forward to most at school?",
        options: ["Biology & Life Sciences", "Math & Physics", "Computer Science", "History & Social Studies", "Art & Design", "Business & Economics"],
        followUp: {
            "Biology & Life Sciences": "Would you prefer medicine, research, or environmental science?",
            "Computer Science": "Are you more interested in AI, app development, or cybersecurity?",
            "Art & Design": "Do you prefer visual art, design, or architecture?"
        }
    },
    {
        question: "If you had a free weekend, what would you build or explore?",
        options: ["A science experiment", "A coding project", "A business idea", "A creative art piece", "A community service plan", "A research paper"]
    },
    {
        question: "What kind of change do you want to see in the world?",
        options: ["Cure diseases", "Solve climate change", "Advance technology", "Promote social justice", "Create beautiful things", "Build better businesses"]
    },
    {
        question: "What kind of work environment suits you best?",
        options: ["Lab/research", "Office/tech", "Creative studio", "Community/field", "Hospital/clinical", "Corporate/boardroom"]
    },
    {
        question: "Which skill do you most want to develop?",
        options: ["Critical thinking", "Coding & AI", "Leadership", "Creativity", "Communication", "Financial acumen"]
    },
    {
        question: "What's your ideal university major?",
        options: ["Medicine", "Engineering", "Computer Science", "Law", "Fine Arts", "Business"]
    }
];

// ========================================
// INTEREST TAG MAPPING (Appendix A)
// ========================================
const interestMap = {
    "Biology & Life Sciences": ["Biology", "Medicine", "Health", "Research"],
    "Math & Physics": ["Physics", "Mathematics", "Engineering"],
    "Computer Science": ["Computer Science", "AI", "Technology", "Data Science"],
    "History & Social Studies": ["History", "Political Science", "Law", "International Relations"],
    "Art & Design": ["Visual Art", "Design", "Architecture", "Creative"],
    "Business & Economics": ["Business", "Entrepreneurship", "Finance", "Marketing"],
    "A science experiment": ["Research", "Chemistry", "Biology"],
    "A coding project": ["AI", "Computer Science", "App Development"],
    "A business idea": ["Entrepreneurship", "Finance", "Business"],
    "A creative art piece": ["Visual Art", "Design", "Creative"],
    "A community service plan": ["Leadership", "Community Service", "Social Impact"],
    "A research paper": ["Research", "Writing", "Critical Thinking"],
    "Cure diseases": ["Medicine", "Biology", "Health"],
    "Solve climate change": ["Environment", "Sustainability", "Engineering"],
    "Advance technology": ["AI", "Technology", "Computer Science"],
    "Promote social justice": ["Law", "Political Science", "Leadership"],
    "Create beautiful things": ["Art", "Design", "Architecture"],
    "Build better businesses": ["Business", "Entrepreneurship", "Finance"],
    "Lab/research": ["Research", "Biology", "Chemistry"],
    "Office/tech": ["Computer Science", "Technology", "Data Science"],
    "Creative studio": ["Visual Art", "Design", "Film"],
    "Community/field": ["Community Service", "Leadership", "Social Impact"],
    "Hospital/clinical": ["Medicine", "Health", "Psychology"],
    "Corporate/boardroom": ["Business", "Finance", "Management"],
    "Critical thinking": ["Research", "Law", "Policy"],
    "Coding & AI": ["AI", "Computer Science", "Technology"],
    "Leadership": ["Leadership", "Management", "Social Impact"],
    "Creativity": ["Art", "Design", "Creative Writing"],
    "Communication": ["Marketing", "International Relations", "Media"],
    "Financial acumen": ["Business", "Finance", "Economics"],
    "Medicine": ["Medicine", "Biology", "Health"],
    "Engineering": ["Engineering", "Mathematics", "Physics"],
    "Computer Science": ["Computer Science", "AI", "Technology"],
    "Law": ["Law", "Political Science", "Justice"],
    "Fine Arts": ["Visual Art", "Design", "Performance"],
    "Business": ["Business", "Entrepreneurship", "Finance"]
};

// ========================================
// TAG EXPLANATIONS (Phase 1 - plain-language)
// ========================================
const tagExplanations = {
    "Biology": "You're curious about life and living systems. This interest leads to careers in medicine, research, or environmental science.",
    "Medicine": "You want to help people through healthcare. This is a path to becoming a doctor, researcher, or public health professional.",
    "Health": "You care about wellbeing and fitness. This interest connects to public health, sports science, and nutrition.",
    "Research": "You love discovering new things. Research skills are valuable for any academic or scientific career.",
    "Physics": "You understand how the universe works. Physics leads to engineering, space exploration, and technology careers.",
    "Mathematics": "You enjoy solving problems with numbers. Math is essential for finance, engineering, data science, and more.",
    "Engineering": "You love building and creating solutions. Engineering is one of the most versatile and in-demand careers.",
    "Computer Science": "You want to shape the future through technology. CS offers careers in AI, software, cybersecurity, and more.",
    "AI": "You're fascinated by intelligent systems. AI is transforming every industry from healthcare to finance.",
    "Technology": "You see technology as a tool for change. Tech skills are among the most valuable for any career.",
    "Data Science": "You understand that data drives decisions. Data science is critical in business, research, and government.",
    "History": "You want to learn from the past. History develops critical thinking valuable for law, policy, and academia.",
    "Political Science": "You care about how societies are governed. This leads to careers in law, diplomacy, and public service.",
    "Law": "You believe in justice and order. Law offers careers in advocacy, corporate law, and public service.",
    "International Relations": "You want to understand global affairs. This leads to diplomacy, international business, and policy.",
    "Visual Art": "You see beauty and express it visually. Art connects to design, architecture, and creative industries.",
    "Design": "You combine aesthetics with functionality. Design is essential in product development, UX, and branding.",
    "Architecture": "You want to shape the spaces where people live. Architecture blends art, engineering, and sustainability.",
    "Creative": "You think differently and express yourself. Creativity is valuable in every career, from business to tech.",
    "Business": "You understand how organizations work. Business leads to leadership, management, and entrepreneurship.",
    "Entrepreneurship": "You want to build something new. Entrepreneurship drives innovation and economic growth.",
    "Finance": "You understand money and markets. Finance is critical in banking, investing, and corporate strategy.",
    "Marketing": "You know how to connect with people. Marketing is essential for brands, nonprofits, and startups.",
    "Environment": "You care about protecting our planet. Environmental careers are growing rapidly across sectors.",
    "Sustainability": "You want to create a better future. Sustainability is a focus in business, policy, and engineering.",
    "Leadership": "You want to inspire and guide others. Leadership is the most valued skill by universities and employers.",
    "Community Service": "You believe in giving back. Service experience is highly valued by top universities.",
    "Social Impact": "You want to make the world better. Impact work connects to nonprofits, policy, and social enterprise."
};

// ========================================
// SAMPLE ACTIVITIES DATA (Phase 2)
// ========================================
const sampleActivities = [
    {
        id: 'act_001',
        name: 'Dubai Youth Sustainability Summit',
        type: 'competition',
        interest_tags: ['Sustainability', 'Environment', 'Leadership'],
        grade_min: 10,
        grade_max: 12,
        country: 'UAE',
        cost: 'Free',
        duration: '3 days',
        deadline: '2026-08-15',
        skills_gained: ['Public Speaking', 'Project Management', 'Research'],
        description: 'Compete with students across the UAE to solve real-world sustainability challenges. Work in teams to develop innovative solutions for a greener future. Finalists present to industry leaders and win prizes!',
        registration_url: 'https://example.com/register-sustainability',
        rationale: 'This summit is perfect for students passionate about the environment and leadership. You\'ll develop essential skills for university applications.',
        registrationRequirements: [
            { id: 'req1', title: 'Personal Statement', description: 'Write 250 words on why sustainability matters to you', dueDate: '2026-08-01' },
            { id: 'req2', title: 'Teacher Recommendation', description: 'Request a recommendation from a science teacher', dueDate: '2026-08-05' },
            { id: 'req3', title: 'Parent Consent Form', description: 'Download, sign, and upload the parent consent form', dueDate: '2026-08-10' }
        ]
    },
    {
        id: 'act_002',
        name: 'Future Tech Internship Program',
        type: 'internship',
        interest_tags: ['Computer Science', 'Technology', 'AI'],
        grade_min: 11,
        grade_max: 12,
        country: 'UAE',
        cost: 'Paid',
        duration: '4 weeks',
        deadline: '2026-07-30',
        skills_gained: ['Python', 'Machine Learning', 'Data Analysis', 'Team Collaboration'],
        description: 'Join a leading tech company in Dubai for a hands-on internship working on real AI projects. You\'ll work alongside engineers and contribute to actual products used by thousands.',
        registration_url: 'https://example.com/register-tech',
        rationale: 'Great opportunity to gain practical tech experience and explore AI careers. This internship is highly regarded by top universities.',
        registrationRequirements: [
            { id: 'req1', title: 'Resume/CV', description: 'List your tech skills, projects, and experience', dueDate: '2026-07-15' },
            { id: 'req2', title: 'Coding Assessment', description: 'Complete a 1-hour coding challenge in Python', dueDate: '2026-07-20' },
            { id: 'req3', title: 'Video Interview', description: 'Record a 5-min video answering interview questions', dueDate: '2026-07-25' }
        ]
    },
    {
        id: 'act_003',
        name: 'Community Leadership Workshop',
        type: 'workshop',
        interest_tags: ['Leadership', 'Community Service', 'Social Impact'],
        grade_min: 10,
        grade_max: 12,
        country: 'UAE',
        cost: 'Free',
        duration: '2 days',
        deadline: '2026-09-01',
        skills_gained: ['Team Management', 'Event Planning', 'Communication', 'Problem Solving'],
        description: 'Learn how to lead community projects and create social impact in your neighborhood. This workshop includes practical sessions with community leaders and hands-on project planning.',
        registration_url: 'https://example.com/register-leadership',
        rationale: 'Develops leadership skills essential for university applications and future careers. Perfect if you want to make a difference in your community.',
        registrationRequirements: [
            { id: 'req1', title: 'Statement of Interest', description: 'Why do you want to become a community leader?', dueDate: '2026-08-20' },
            { id: 'req2', title: 'Reference Letter', description: 'From a teacher or community leader', dueDate: '2026-08-25' }
        ]
    },
    {
        id: 'act_004',
        name: 'Medical Research Summer Program',
        type: 'course',
        interest_tags: ['Medicine', 'Biology', 'Research'],
        grade_min: 11,
        grade_max: 12,
        country: 'Global',
        cost: 'Scholarship available',
        duration: '6 weeks',
        deadline: '2026-05-15',
        skills_gained: ['Lab Skills', 'Scientific Writing', 'Critical Thinking', 'Data Analysis'],
        description: 'An intensive summer research program where you\'ll work in university labs on actual medical research projects. Includes mentorship from PhD students and professors.',
        registration_url: 'https://example.com/register-medical',
        rationale: 'Excellent preparation for medical school applications. You\'ll gain hands-on research experience that sets you apart from other applicants.',
        registrationRequirements: [
            { id: 'req1', title: 'Research Essay', description: 'Write 500 words on a medical topic of your choice', dueDate: '2026-04-30' },
            { id: 'req2', title: 'Academic Transcript', description: 'Submit your grades in science subjects', dueDate: '2026-05-05' },
            { id: 'req3', title: 'Recommendation Letter', description: 'From a science teacher or mentor', dueDate: '2026-05-10' },
            { id: 'req4', title: 'Parent Permission', description: 'Signed form for international travel', dueDate: '2026-05-12' }
        ]
    },
    {
        id: 'act_005',
        name: 'Global Entrepreneurship Challenge',
        type: 'competition',
        interest_tags: ['Business', 'Entrepreneurship', 'Finance'],
        grade_min: 10,
        grade_max: 12,
        country: 'Global',
        cost: 'Free',
        duration: '2 months',
        deadline: '2026-10-01',
        skills_gained: ['Business Planning', 'Pitching', 'Financial Modeling', 'Team Leadership'],
        description: 'Pitch your business idea to a panel of investors from around the world. Winners receive funding and mentorship to launch their startup.',
        registration_url: 'https://example.com/register-business',
        rationale: 'Perfect if you\'re interested in business and entrepreneurship. You\'ll develop skills that are valuable for any career path.',
        registrationRequirements: [
            { id: 'req1', title: 'Business Pitch Deck', description: 'Create a 5-slide pitch for your business idea', dueDate: '2026-09-15' },
            { id: 'req2', title: 'Financial Plan', description: 'Outline your revenue model and costs', dueDate: '2026-09-20' },
            { id: 'req3', title: 'Team Agreement', description: 'If working in a team, submit a team agreement form', dueDate: '2026-09-25' }
        ]
    },
    {
        id: 'act_006',
        name: 'Art & Design Portfolio Workshop',
        type: 'workshop',
        interest_tags: ['Visual Art', 'Design', 'Creative'],
        grade_min: 10,
        grade_max: 12,
        country: 'UAE',
        cost: 'Free',
        duration: '1 week',
        deadline: '2026-08-20',
        skills_gained: ['Portfolio Development', 'Drawing', 'Digital Design', 'Creative Thinking'],
        description: 'Build a professional portfolio for art school applications. Work with professional artists and designers to create your best work.',
        registration_url: 'https://example.com/register-art',
        rationale: 'Essential if you\'re planning to apply to art or design programs. You\'ll leave with a portfolio ready for submission.',
        registrationRequirements: [
            { id: 'req1', title: 'Portfolio Samples', description: 'Submit 3-5 samples of your best work', dueDate: '2026-08-10' },
            { id: 'req2', title: 'Artist Statement', description: 'Write 200 words about your artistic vision', dueDate: '2026-08-15' }
        ]
    }
];

// ========================================
// DOM REFERENCES
// ========================================
const $ = (id) => document.getElementById(id);
const phase1 = $('phase1');
const phase2 = $('phase2');
const phase3 = $('phase3');

// Phase 1
const profileForm = $('profileForm');
const step1Profile = $('step1-profile');
const step2Quiz = $('step2-quiz');
const step3Review = $('step3-profile-review');
const quizQuestion = $('quizQuestion');
const quizOptions = $('quizOptions');
const quizProgress = $('quizProgress');
const quizProgressFill = $('quizProgressFill');
const quizNextBtn = $('quizNextBtn');
const interestProfileDisplay = $('interestProfileDisplay');
const confirmProfileBtn = $('confirmProfileBtn');
const editProfileBtn = $('editProfileBtn');

// Phase 2
const activityGrid = $('activityCardsGrid');
const interestProfileDisplay2 = $('interestProfileDisplay2');
const refreshActivitiesBtn = $('refreshActivitiesBtn');
const filterType = $('filterType');
const filterCost = $('filterCost');
const applyFiltersBtn = $('applyFiltersBtn');

// Phase 3
const phase3Content = $('phase3Content');
const phase3ActivityName = $('phase3ActivityName');
const backToActivitiesBtn = $('backToActivitiesBtn');

// Modal
const modal = $('activityDetailModal');
const modalContent = $('activityDetailContent');
const closeModalBtn = $('closeModalBtn');

// Auth
const userNameDisplay = $('userNameDisplay');
const logoutBtn = $('logoutBtn');

// ========================================
// AUTHENTICATION
// ========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        state.user = user;
        userNameDisplay.textContent = `👋 ${user.email}`;
        document.getElementById('studentEmail').value = user.email;
        document.getElementById('studentEmail').disabled = true;
        
        // Load student profile from Firestore
        await loadStudentProfile(user.uid);
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
});

async function loadStudentProfile(uid) {
    try {
        const docRef = doc(db, 'students', uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            state.studentProfile = data;
            state.interests = data.interests || [];
            state.registeredActivities = data.registeredActivities || [];
            
            // If student already has interests, go to Phase 2
            if (state.interests.length > 0) {
                showPhase('phase2');
                await loadActivities();
            } else {
                // Pre-fill profile form
                if (data.name) document.getElementById('studentName').value = data.name;
                if (data.grade) document.getElementById('studentGrade').value = data.grade;
                if (data.school) document.getElementById('studentSchool').value = data.school;
                if (data.country) document.getElementById('studentCountry').value = data.country;
            }
        } else {
            // New student - create profile in Firestore
            await setDoc(docRef, {
                email: state.user.email,
                createdAt: serverTimestamp(),
                interests: [],
                registeredActivities: [],
                completedActivities: [],
                profileStrength: 0
            });
            state.studentProfile = { email: state.user.email };
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ========================================
// PHASE 1: ONBOARDING & INTEREST DISCOVERY
// ========================================

// Step 1: Profile Form Submission
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('studentName').value.trim();
    const grade = parseInt(document.getElementById('studentGrade').value);
    const school = document.getElementById('studentSchool').value.trim();
    const country = document.getElementById('studentCountry').value.trim();
    
    if (!name || !grade) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Save to Firestore
    try {
        const docRef = doc(db, 'students', state.user.uid);
        await updateDoc(docRef, {
            name,
            grade,
            school,
            country,
            updatedAt: serverTimestamp()
        });
        
        state.studentProfile = { ...state.studentProfile, name, grade, school, country };
        
        // Move to quiz
        step1Profile.style.display = 'none';
        step2Quiz.style.display = 'block';
        startQuiz();
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile. Please try again.');
    }
});

// Step 2: Quiz
function startQuiz() {
    state.currentQuestion = 0;
    state.interests = [];
    renderQuestion();
}

function renderQuestion() {
    const q = quizQuestions[state.currentQuestion];
    if (!q) {
        finishQuiz();
        return;
    }
    
    const totalQuestions = quizQuestions.length;
    const progress = ((state.currentQuestion + 1) / totalQuestions) * 100;
    
    if (quizProgress) {
        quizProgress.textContent = `Question ${state.currentQuestion + 1} of ${totalQuestions}`;
    }
    if (quizProgressFill) {
        quizProgressFill.style.width = `${progress}%`;
    }
    if (quizQuestion) {
        quizQuestion.textContent = q.question;
    }
    if (quizOptions) {
        quizOptions.innerHTML = '';
        
        q.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = option;
            btn.dataset.value = option;
            btn.addEventListener('click', () => selectQuizOption(btn));
            quizOptions.appendChild(btn);
        });
    }
    
    if (quizNextBtn) {
        quizNextBtn.disabled = true;
    }
}

function selectQuizOption(selectedBtn) {
    // Deselect all
    document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
    selectedBtn.classList.add('selected');
    if (quizNextBtn) {
        quizNextBtn.disabled = false;
    }
    
    // Store selected value
    const answer = selectedBtn.dataset.value;
    
    // Map to interest tags
    const tags = interestMap[answer] || [];
    state.interests = [...state.interests, ...tags];
}

if (quizNextBtn) {
    quizNextBtn.addEventListener('click', () => {
        const selected = document.querySelector('.quiz-option.selected');
        if (!selected) return;
        
        state.currentQuestion++;
        if (state.currentQuestion < quizQuestions.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    });
}

function finishQuiz() {
    // Deduplicate interests
    state.interests = [...new Set(state.interests)];
    
    // Show profile review
    if (step2Quiz) step2Quiz.style.display = 'none';
    if (step3Review) step3Review.style.display = 'block';
    renderInterestProfile();
}

// Step 3: Interest Profile Review
function renderInterestProfile() {
    const tags = state.interests.slice(0, 6); // Top 6 interests
    
    if (interestProfileDisplay) {
        interestProfileDisplay.innerHTML = tags.map(tag => `
            <div class="interest-tag-modern">
                ${tag}
                <span class="explanation">${tagExplanations[tag] || 'This interest opens up many exciting career paths and university opportunities.'}</span>
            </div>
        `).join('');
    }
}

if (confirmProfileBtn) {
    confirmProfileBtn.addEventListener('click', async () => {
        // Save interests to Firestore
        try {
            const docRef = doc(db, 'students', state.user.uid);
            await updateDoc(docRef, {
                interests: state.interests,
                updatedAt: serverTimestamp()
            });
            
            // Move to Phase 2
            showPhase('phase2');
            await loadActivities();
        } catch (error) {
            console.error('Error saving interests:', error);
            alert('Failed to save interests. Please try again.');
        }
    });
}

if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        // Go back to quiz
        if (step3Review) step3Review.style.display = 'none';
        if (step2Quiz) step2Quiz.style.display = 'block';
        state.currentQuestion = quizQuestions.length - 1;
        renderQuestion();
    });
}

// ========================================
// PHASE 2: CURATED ACTIVITY RECOMMENDATIONS
// ========================================

async function loadActivities() {
    // Show loading state
    if (activityGrid) {
        activityGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="font-size: 40px;">⏳</div>
                <p style="color: #666;">Loading activities...</p>
            </div>
        `;
    }
    
    // Display interests
    const interestsDisplay = state.interests.slice(0, 5).join(' • ');
    if (interestProfileDisplay2) {
        interestProfileDisplay2.textContent = `🎯 ${interestsDisplay}`;
    }
    
    try {
        // Try to load from Firestore first
        const activitiesRef = collection(db, 'activities');
        const q = query(activitiesRef);
        const snapshot = await getDocs(q);
        
        let activities = [];
        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                activities.push(data);
            });
        } else {
            // Use sample data if no activities in Firestore
            activities = sampleActivities;
        }
        
        state.allActivities = activities;
        applyFilters();
    } catch (error) {
        console.error('Error loading activities:', error);
        // Fallback to sample data
        state.allActivities = sampleActivities;
        applyFilters();
    }
}

function applyFilters() {
    const type = filterType ? filterType.value : 'all';
    const cost = filterCost ? filterCost.value : 'all';
    const grade = state.studentProfile?.grade || 10;
    const interests = state.interests;
    
    let filtered = state.allActivities.filter(activity => {
        // Grade filter
        if (activity.grade_min > grade || activity.grade_max < grade) return false;
        
        // Type filter
        if (type !== 'all' && activity.type !== type) return false;
        
        // Cost filter
        if (cost !== 'all' && activity.cost !== cost) return false;
        
        return true;
    });
    
    // Score and sort by interest match
    filtered = filtered.map(activity => {
        const matchCount = (activity.interest_tags || []).filter(tag => 
            interests.some(interest => 
                tag.toLowerCase().includes(interest.toLowerCase()) || 
                interest.toLowerCase().includes(tag.toLowerCase())
            )
        ).length;
        const score = activity.interest_tags.length > 0 ? matchCount / activity.interest_tags.length : 0;
        return { ...activity, matchScore: score };
    });
    
    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore);
    
    // Take top 8
    const topActivities = filtered.slice(0, 8);
    state.filteredActivities = topActivities;
    
    renderActivityCards(topActivities);
}

function renderActivityCards(activities) {
    if (!activityGrid) return;
    
    if (!activities || activities.length === 0) {
        activityGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8f4ff; border-radius: 20px;">
                <div style="font-size: 48px;">🔍</div>
                <h3 style="color: #2D1B4E; margin: 15px 0;">No activities found</h3>
                <p style="color: #666; max-width: 400px; margin: 0 auto;">Try adjusting your filters or complete more of the quiz.</p>
            </div>
        `;
        return;
    }
    
    const isRegistered = (id) => state.registeredActivities.includes(id);
    
    activityGrid.innerHTML = activities.map((activity, index) => `
        <div class="activity-card-modern" style="animation: fadeIn 0.5s ease ${index * 0.08}s both;">
            <div class="card-header">
                <span class="card-badge-modern ${activity.matchScore > 0.5 ? 'card-badge-top' : 'card-badge-good'}">
                    ${activity.type || 'Activity'}
                </span>
                <span class="card-match">${activity.matchScore > 0.5 ? '🔥 Top Match' : '💡 Good Fit'}</span>
            </div>
            <h3>${activity.name}</h3>
            <div class="card-meta">
                <span>⏱️ ${activity.duration || 'N/A'}</span>
                <span>💰 ${activity.cost || 'Free'}</span>
                <span>📅 ${activity.deadline || 'Rolling'}</span>
            </div>
            <div class="card-rationale">
                <strong>✨ Why this fits you:</strong> ${activity.rationale || 'Based on your interests and goals.'}
            </div>
            <div class="card-tags">
                ${(activity.interest_tags || []).slice(0, 3).map(tag => 
                    `<span>#${tag}</span>`
                ).join('')}
                ${(activity.interest_tags || []).length > 3 ? 
                    `<span style="color: #888; font-size: 11px;">+${(activity.interest_tags || []).length - 3} more</span>` : ''}
            </div>
            <div class="card-actions">
                <button onclick="window.viewActivity('${activity.id}')" class="btn-detail-modern">📖 Details</button>
                <button onclick="window.startRegistration('${activity.id}')" class="btn-register-modern ${isRegistered(activity.id) ? 'registered' : ''}">
                    ${isRegistered(activity.id) ? '✅ Registered' : '📝 Register'}
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// ACTIVITY DETAIL MODAL
// ========================================
window.viewActivity = function(activityId) {
    const activity = state.allActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    if (modalContent) {
        modalContent.innerHTML = `
            <h2 style="color: #1a1a2e; margin-bottom: 8px; font-size: 1.8rem;">${activity.name}</h2>
            <span style="background: linear-gradient(135deg, #6C3CE1, #a855f7); color: white; padding: 4px 18px; border-radius: 50px; font-size: 14px; display: inline-block; margin-bottom: 15px;">
                ${activity.type}
            </span>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; padding: 15px; background: #f8f6ff; border-radius: 16px;">
                <div><strong>📍 Location:</strong> ${activity.country || 'Global'}</div>
                <div><strong>⏱️ Duration:</strong> ${activity.duration || 'N/A'}</div>
                <div><strong>💰 Cost:</strong> ${activity.cost || 'Free'}</div>
                <div><strong>📅 Deadline:</strong> ${activity.deadline || 'Rolling'}</div>
                <div style="grid-column: 1/-1;"><strong>🎓 Grades:</strong> ${activity.grade_min || 10} - ${activity.grade_max || 12}</div>
            </div>
            
            <div style="margin: 15px 0;">
                <h4 style="color: #1a1a2e;">📝 Description</h4>
                <p style="color: #4a4a6a; line-height: 1.6;">${activity.description || 'No description available.'}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h4 style="color: #1a1a2e;">🎯 Skills You'll Gain</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${(activity.skills_gained || []).map(skill => 
                        `<span style="background: #f0e6ff; color: #6C3CE1; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 600;">${skill}</span>`
                    ).join('') || '<span style="color: #888;">No skills listed.</span>'}
                </div>
            </div>
            
            <div style="margin: 15px 0; background: #f8f6ff; border-radius: 16px; padding: 15px;">
                <h4 style="color: #1a1a2e;">🤖 AI Assistant</h4>
                <p style="color: #4a4a6a; font-size: 14px;">Ask about this activity:</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <input type="text" id="aiQuestionInput" placeholder="e.g., Is this right for me?" 
                           style="flex: 1; padding: 10px 16px; border: 2px solid #e8e4f0; border-radius: 50px; font-family: inherit;">
                    <button onclick="window.askAI('${activity.id}')" class="btn-primary" style="padding: 10px 24px;">Ask AI</button>
                </div>
                <div id="aiResponse" style="margin-top: 12px; padding: 12px; background: white; border-radius: 12px; display: none; border-left: 4px solid #6C3CE1;"></div>
            </div>
            
            <button onclick="window.startRegistration('${activity.id}')" class="btn-primary btn-full" style="margin-top: 10px; width: 100%;">
                📝 Register for This Activity
            </button>
        `;
    }
    
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
};

// ========================================
// AI Q&A (Phase 2)
// ========================================
window.askAI = function(activityId) {
    const activity = state.allActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    const input = document.getElementById('aiQuestionInput');
    const responseDiv = document.getElementById('aiResponse');
    const question = input?.value?.trim() || 'Is this right for me?';
    
    // Simulate AI response based on question
    let response = '';
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('right') || lowerQ.includes('fit') || lowerQ.includes('good')) {
        response = `Based on your interest in ${(activity.interest_tags || []).slice(0, 3).join(', ')}, ${activity.name} is an excellent match! This activity is designed for Grade ${activity.grade_min}-${activity.grade_max} students and will help you develop ${(activity.skills_gained || []).slice(0, 3).join(', ')}. The ${activity.cost || 'free'} registration and ${activity.duration || 'flexible'} schedule make it very accessible. I'd say this is a great fit for your profile!`;
    } else if (lowerQ.includes('learn') || lowerQ.includes('gain')) {
        response = `In ${activity.name}, you will learn: ${(activity.skills_gained || []).join(', ')}. Additionally, you'll gain practical experience in ${(activity.interest_tags || []).slice(0, 3).join(', ')}. Past participants have found this activity to be transformative for their university applications.`;
    } else if (lowerQ.includes('hard') || lowerQ.includes('difficult') || lowerQ.includes('competition')) {
        response = `The application for ${activity.name} is competitive but accessible. You'll need to prepare materials like ${(activity.registrationRequirements || []).map(r => r.title).join(', ')}. The deadline is ${activity.deadline || 'rolling'}, so I'd recommend starting at least 2 weeks before. Need help with any part of the application? I can guide you through it!`;
    } else {
        response = `Great question about ${activity.name}! Here's what I can tell you: This ${activity.type} focuses on ${(activity.interest_tags || []).join(', ')}. It runs for ${activity.duration || 'a specified period'} and is ${activity.cost || 'free'}. If you have more specific questions, feel free to ask!`;
    }
    
    if (responseDiv) {
        responseDiv.style.display = 'block';
        responseDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <span style="font-size: 24px;">🤖</span>
                <div>
                    <strong style="color: #6C3CE1;">AI Response:</strong>
                    <p style="margin-top: 8px; color: #333; line-height: 1.6;">${response}</p>
                </div>
            </div>
        `;
    }
};

// ========================================
// PHASE 3: ACTIVITY SELECTION & REGISTRATION
// ========================================
window.startRegistration = function(activityId) {
    const activity = state.allActivities.find(a => a.id === activityId);
    if (!activity) {
        alert('Activity not found.');
        return;
    }
    
    state.selectedActivity = activity;
    showPhase('phase3');
    if (phase3ActivityName) {
        phase3ActivityName.textContent = `📝 ${activity.name}`;
    }
    
    const isRegistered = state.registeredActivities.includes(activityId);
    
    if (phase3Content) {
        phase3Content.innerHTML = `
            <div class="phase3-content">
                <div class="activity-summary">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        <span style="background: #6C3CE1; color: white; padding: 4px 14px; border-radius: 50px; font-size: 14px;">${activity.type}</span>
                        <span style="color: #888;">📅 ${activity.deadline || 'Rolling deadline'}</span>
                        <span style="color: #888;">💰 ${activity.cost || 'Free'}</span>
                    </div>
                    
                    <div class="readiness-box-modern">
                        <strong>📋 Your Readiness Summary</strong>
                        <p style="margin-top: 8px; color: #4a4a6a;">You have a strong interest in ${(activity.interest_tags || []).slice(0, 3).join(', ')}. ${activity.name} is a perfect match to build your skills. Here's your personalized registration checklist to get started.</p>
                    </div>
                </div>
                
                <div class="checklist-modern">
                    <h4 style="color: #1a1a2e; margin-bottom: 10px;">✅ Registration Checklist</h4>
                    <p style="color: #c44536; font-weight: 500; margin-bottom: 15px;">Main Deadline: ${activity.deadline || 'Rolling'}</p>
                    <div id="checklistContainer">
                        ${(activity.registrationRequirements || []).map((req, index) => `
                            <div class="checklist-item-modern" id="checklist-${req.id}" data-completed="false">
                                <input type="checkbox" id="check-${req.id}" onchange="window.toggleChecklist('${req.id}')" ${isRegistered ? 'disabled checked' : ''} />
                                <div class="checklist-item-content">
                                    <span class="checklist-item-title">${index + 1}. ${req.title}</span>
                                    <span class="checklist-item-desc">${req.description}</span>
                                    <span class="checklist-item-due">📅 Due: ${req.dueDate || 'Before deadline'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="registration-actions-modern">
                    ${isRegistered ? `
                        <p style="color: #28a745; font-weight: 600;">✅ You are already registered for this activity!</p>
                        <button onclick="window.goToPhase2()" class="btn-secondary">Back to Activities</button>
                    ` : `
                        <p style="color: #6b6b8a; margin-bottom: 10px;">Complete all steps above to register</p>
                        <button id="finalRegisterBtn" class="btn-primary" disabled>Complete all steps to register</button>
                        <br>
                        <button onclick="window.goToPhase2()" class="btn-secondary" style="margin-top: 10px;">← Back to Activities</button>
                    `}
                </div>
            </div>
        `;
    }
    
    if (!isRegistered) {
        // Enable register button when all checklist items are checked
        window.toggleChecklist = function(reqId) {
            const item = document.getElementById(`checklist-${reqId}`);
            const checkbox = document.getElementById(`check-${reqId}`);
            if (checkbox.checked) {
                if (item) {
                    item.dataset.completed = 'true';
                    item.classList.add('completed');
                }
            } else {
                if (item) {
                    item.dataset.completed = 'false';
                    item.classList.remove('completed');
                }
            }
            
            // Check if all items are completed
            const allItems = document.querySelectorAll('#checklistContainer .checklist-item-modern');
            let allDone = true;
            allItems.forEach(el => {
                if (el.dataset.completed === 'false') allDone = false;
            });
            
            const btn = document.getElementById('finalRegisterBtn');
            if (btn) {
                btn.disabled = !allDone;
                btn.textContent = allDone ? '✅ Complete Registration' : 'Complete all steps to register';
                if (allDone) {
                    btn.onclick = function() {
                        window.completeRegistration(activityId);
                    };
                }
            }
        };
    }
};

// ========================================
// COMPLETE REGISTRATION (Phase 3)
// ========================================
window.completeRegistration = async function(activityId) {
    if (state.registeredActivities.includes(activityId)) {
        alert('You are already registered for this activity!');
        return;
    }
    
    // Add to registered activities in Firestore
    try {
        const docRef = doc(db, 'students', state.user.uid);
        await updateDoc(docRef, {
            registeredActivities: arrayUnion(activityId),
            updatedAt: serverTimestamp()
        });
        
        state.registeredActivities.push(activityId);
        
        alert(`🎉 Congratulations! You have successfully registered for "${state.selectedActivity.name}"!`);
        
        // Go back to Phase 2
        goToPhase2();
        await loadActivities();
    } catch (error) {
        console.error('Error completing registration:', error);
        alert('Failed to complete registration. Please try again.');
    }
};

// ========================================
// NAVIGATION
// ========================================
function showPhase(phaseId) {
    document.querySelectorAll('.phase').forEach(el => el.classList.remove('active'));
    const phase = document.getElementById(phaseId);
    if (phase) {
        phase.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToPhase2 = function() {
    showPhase('phase2');
    loadActivities();
};

// ========================================
// FILTER HANDLERS
// ========================================
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
}
if (refreshActivitiesBtn) {
    refreshActivitiesBtn.addEventListener('click', loadActivities);
}
if (backToActivitiesBtn) {
    backToActivitiesBtn.addEventListener('click', goToPhase2);
}

// ========================================
// MODAL HANDLERS
// ========================================
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    });
}

// ========================================
// LOGOUT
// ========================================
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }
});

console.log('🎯 Student App (Phases 1, 2, 3) loaded!');
console.log('📌 Make sure you have activities in your Firestore "activities" collection.');
console.log('📌 If not, run seedActivities() in console to add sample activities.');
