// ============================================
// PHASE 5: GRADE-BASED UNIVERSITY PATHWAY
// ============================================

// University database
const UNIVERSITY_DATABASE = [
    {
        id: 1,
        name: "Massachusetts Institute of Technology (MIT)",
        country: "USA",
        programs: ["Computer Science", "Engineering", "Data Science", "Physics"],
        selectivity: "Reach",
        acceptanceRate: "4%",
        notableFor: ["STEM", "Research", "Innovation"],
        interestTags: ["STEM", "Computer Science", "Engineering", "Data Science", "Technology"]
    },
    {
        id: 2,
        name: "Stanford University",
        country: "USA",
        programs: ["Computer Science", "Business", "Engineering", "Design"],
        selectivity: "Reach",
        acceptanceRate: "4%",
        notableFor: ["Entrepreneurship", "Technology", "Innovation"],
        interestTags: ["STEM", "Business", "Entrepreneurship", "Technology"]
    },
    {
        id: 3,
        name: "University of Toronto",
        country: "Canada",
        programs: ["Engineering", "Computer Science", "Medicine", "Business"],
        selectivity: "Target",
        acceptanceRate: "15%",
        notableFor: ["Research", "Diversity", "Innovation"],
        interestTags: ["STEM", "Medicine", "Engineering", "Business"]
    },
    {
        id: 4,
        name: "University of British Columbia",
        country: "Canada",
        programs: ["Environmental Science", "Biology", "Engineering", "Arts"],
        selectivity: "Target",
        acceptanceRate: "18%",
        notableFor: ["Sustainability", "Research", "Campus Life"],
        interestTags: ["Environment", "Biology", "STEM", "Arts"]
    },
    {
        id: 5,
        name: "King's College London",
        country: "UK",
        programs: ["Medicine", "Law", "Psychology", "Politics"],
        selectivity: "Target",
        acceptanceRate: "20%",
        notableFor: ["Medicine", "Law", "Social Sciences"],
        interestTags: ["Medicine", "Health", "Law", "Political Science"]
    },
    {
        id: 6,
        name: "University of Melbourne",
        country: "Australia",
        programs: ["Medicine", "Engineering", "Business", "Arts"],
        selectivity: "Safety",
        acceptanceRate: "30%",
        notableFor: ["Research", "Quality of Life", "Diversity"],
        interestTags: ["Medicine", "Engineering", "Business", "Arts"]
    },
    {
        id: 7,
        name: "National University of Singapore",
        country: "Singapore",
        programs: ["Engineering", "Computer Science", "Business", "Law"],
        selectivity: "Target",
        acceptanceRate: "12%",
        notableFor: ["Research", "Innovation", "Asia"],
        interestTags: ["STEM", "Business", "Engineering", "Technology"]
    },
    {
        id: 8,
        name: "University of Cambridge",
        country: "UK",
        programs: ["Mathematics", "Physics", "Medicine", "Engineering"],
        selectivity: "Reach",
        acceptanceRate: "5%",
        notableFor: ["STEM", "Research", "History"],
        interestTags: ["STEM", "Physics", "Mathematics", "Medicine"]
    }
];

// Store shortlist data
let universityShortlist = {
    reach: [],
    target: [],
    safety: []
};

// Initialize Phase 5
function initPhase5() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        const grade = student.grade || 10;
        
        // Initialize phase navigation
        if (typeof initPhaseNavigation === 'function') {
            initPhaseNavigation();
        }
        
        // Show grade-specific content
        if (grade === 11) {
            showGrade11Experience(student);
        } else if (grade === 10) {
            showGrade10Experience(student);
        } else if (grade === 12) {
            showGrade12Experience(student);
        } else {
            // Default to Grade 10
            showGrade10Experience(student);
        }
    } catch (error) {
        console.log('Error initializing Phase 5:', error);
    }
}

// Grade 11 Experience
function showGrade11Experience(student) {
    const grade11Content = document.getElementById('grade-11-content');
    const grade10Content = document.getElementById('grade-10-content');
    const grade12Content = document.getElementById('grade-12-content');
    
    if (grade11Content) grade11Content.style.display = 'block';
    if (grade10Content) grade10Content.style.display = 'none';
    if (grade12Content) grade12Content.style.display = 'none';

    // Generate university shortlist
    generateUniversityShortlist(student);
    displayShortlist();
    showCTACard();
}

// Generate university shortlist based on interests
function generateUniversityShortlist(student) {
    const interests = student.interests || [];
    const matched = [];

    // Find matching universities
    UNIVERSITY_DATABASE.forEach(uni => {
        const matches = uni.interestTags.some(tag => 
            interests.some(interest => 
                interest && (interest.toLowerCase().includes(tag.toLowerCase()) ||
                tag.toLowerCase().includes(interest.toLowerCase()))
            )
        );
        if (matches) {
            matched.push(uni);
        }
    });

    // If not enough matches, add some top universities
    if (matched.length < 6) {
        UNIVERSITY_DATABASE.forEach(uni => {
            if (!matched.find(m => m.id === uni.id)) {
                matched.push(uni);
            }
        });
    }

    // Categorize into Reach, Target, Safety
    const reach = matched.filter(uni => uni.selectivity === 'Reach').slice(0, 2);
    const target = matched.filter(uni => uni.selectivity === 'Target').slice(0, 3);
    const safety = matched.filter(uni => uni.selectivity === 'Safety').slice(0, 2);

    // Ensure we have at least 3 total
    while (reach.length + target.length + safety.length < 3) {
        const extra = matched.find(uni => 
            !reach.includes(uni) && !target.includes(uni) && !safety.includes(uni)
        );
        if (extra) {
            if (extra.selectivity === 'Reach') reach.push(extra);
            else if (extra.selectivity === 'Target') target.push(extra);
            else safety.push(extra);
        } else {
            break;
        }
    }

    universityShortlist = { reach, target, safety };
    
    // Save to localStorage
    localStorage.setItem('universityShortlist', JSON.stringify(universityShortlist));
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        student.universityShortlist = universityShortlist;
        localStorage.setItem('studentProfile', JSON.stringify(student));
    } catch {
        // Ignore
    }
}

// Display shortlist
function displayShortlist() {
    // Display Reach schools
    const reachContainer = document.getElementById('reach-schools');
    if (reachContainer) {
        reachContainer.innerHTML = '';
        if (universityShortlist.reach && universityShortlist.reach.length > 0) {
            universityShortlist.reach.forEach(uni => {
                reachContainer.appendChild(createUniversityCard(uni));
            });
        } else {
            reachContainer.innerHTML = '<p class="no-results">No reach schools found. Try updating your interests.</p>';
        }
    }

    // Display Target schools
    const targetContainer = document.getElementById('target-schools');
    if (targetContainer) {
        targetContainer.innerHTML = '';
        if (universityShortlist.target && universityShortlist.target.length > 0) {
            universityShortlist.target.forEach(uni => {
                targetContainer.appendChild(createUniversityCard(uni));
            });
        } else {
            targetContainer.innerHTML = '<p class="no-results">No target schools found. Try updating your interests.</p>';
        }
    }

    // Display Safety schools
    const safetyContainer = document.getElementById('safety-schools');
    if (safetyContainer) {
        safetyContainer.innerHTML = '';
        if (universityShortlist.safety && universityShortlist.safety.length > 0) {
            universityShortlist.safety.forEach(uni => {
                safetyContainer.appendChild(createUniversityCard(uni));
            });
        } else {
            safetyContainer.innerHTML = '<p class="no-results">No safety schools found. Try updating your interests.</p>';
        }
    }
}

// Create university card
function createUniversityCard(uni) {
    const div = document.createElement('div');
    div.className = `uni-card ${uni.selectivity.toLowerCase()}`;
    div.innerHTML = `
        <h4>${uni.name}</h4>
        <p class="uni-country">📍 ${uni.country}</p>
        <p class="uni-programs">${uni.programs.join(' • ')}</p>
        <p class="uni-acceptance">Acceptance: ${uni.acceptanceRate}</p>
        <p class="uni-rationale">💡 Recommended because you're interested in ${uni.programs[0] || 'this field'}</p>
        <span class="uni-badge ${uni.selectivity.toLowerCase()}">${uni.selectivity}</span>
    `;
    return div;
}

// Show CTA card for Grade 11
function showCTACard() {
    const ctaContainer = document.getElementById('cta-card');
    if (ctaContainer) {
        ctaContainer.style.display = 'block';
        ctaContainer.innerHTML = `
            <div class="cta-fullscreen-card">
                <h2>🚀 Ready to turn this shortlist into a real application?</h2>
                <p>Book your first session with a Futures Abroad counselor.</p>
                <button id="cta-enroll-btn" class="cta-primary">
                    Register with Futures Abroad →
                </button>
            </div>
        `;

        const ctaBtn = document.getElementById('cta-enroll-btn');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', function() {
                goToPhase6();
            });
        }
    }
}

// Grade 10 Experience
function showGrade10Experience(student) {
    const grade11Content = document.getElementById('grade-11-content');
    const grade10Content = document.getElementById('grade-10-content');
    const grade12Content = document.getElementById('grade-12-content');
    
    if (grade11Content) grade11Content.style.display = 'none';
    if (grade10Content) grade10Content.style.display = 'block';
    if (grade12Content) grade12Content.style.display = 'none';

    // Show progress
    const score = student.profileStrengthScore || 0;
    const scoreDisplay = document.getElementById('profile-score');
    if (scoreDisplay) scoreDisplay.textContent = score;
    
    const bar = document.getElementById('strength-bar-grade10');
    if (bar) bar.style.width = score + '%';

    // Show gap analysis
    showGapAnalysis(student);

    // Show roadmap
    showRoadmap();

    // Soft CTA
    const softCta = document.getElementById('soft-cta');
    if (softCta) {
        softCta.addEventListener('click', function() {
            window.location.href = 'futures-abroad-enroll.html';
        });
    }
}

// Show gap analysis
function showGapAnalysis(student) {
    let portfolio = [];
    try {
        portfolio = JSON.parse(localStorage.getItem('studentPortfolio') || '[]');
    } catch {
        portfolio = [];
    }
    
    const gaps = [];
    const types = new Set();
    portfolio.forEach(e => {
        if (e.activityType) types.add(e.activityType);
    });

    if (!types.has('volunteering') && !types.has('Volunteering')) {
        gaps.push('You have strong academics but no volunteering experience yet');
    }
    if (!types.has('competition') && !types.has('Competition')) {
        gaps.push('Consider joining a competition to build your profile');
    }
    if (!types.has('internship') && !types.has('Internship')) {
        gaps.push('Internships are valuable for university applications');
    }
    if (portfolio.length < 3) {
        gaps.push('Try completing more activities to build a strong portfolio');
    }

    const container = document.getElementById('gap-analysis');
    if (container) {
        container.innerHTML = '';
        if (gaps.length > 0) {
            gaps.forEach(gap => {
                const div = document.createElement('div');
                div.className = 'gap-item';
                div.innerHTML = `⚠️ ${gap}`;
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<p class="no-gaps">✅ You have a well-rounded profile! Keep up the great work!</p>';
        }
    }
}

// Show roadmap
function showRoadmap() {
    const roadmap = [
        { month: 'Month 1', task: 'Start volunteering or community service' },
        { month: 'Month 3', task: 'Join a competition or academic challenge' },
        { month: 'Month 6', task: 'Take on a leadership role in an activity' },
        { month: 'Month 9', task: 'Build your portfolio with diverse experiences' },
        { month: 'Month 12', task: 'Start researching universities and programs' }
    ];

    const container = document.getElementById('roadmap-timeline');
    if (container) {
        container.innerHTML = '';
        roadmap.forEach(item => {
            const div = document.createElement('div');
            div.className = 'milestone';
            div.innerHTML = `
                <span class="milestone-month">${item.month}</span>
                <span class="milestone-task">${item.task}</span>
            `;
            container.appendChild(div);
        });
    }
}

// Grade 12 Experience
function showGrade12Experience(student) {
    const grade11Content = document.getElementById('grade-11-content');
    const grade10Content = document.getElementById('grade-10-content');
    const grade12Content = document.getElementById('grade-12-content');
    
    if (grade11Content) grade11Content.style.display = 'none';
    if (grade10Content) grade10Content.style.display = 'none';
    if (grade12Content) grade12Content.style.display = 'block';

    // Show deadlines
    const deadlines = [
        { date: 'November 1', task: 'Early Decision Application Deadline' },
        { date: 'January 1', task: 'Regular Decision Application Deadline' },
        { date: 'February 15', task: 'Financial Aid Application Deadline' }
    ];

    const container = document.getElementById('deadline-list');
    if (container) {
        container.innerHTML = '';
        deadlines.forEach(deadline => {
            const div = document.createElement('div');
            div.className = 'deadline-item';
            div.innerHTML = `
                <span class="deadline-date">📅 ${deadline.date}</span>
                <span class="deadline-task">${deadline.task}</span>
            `;
            container.appendChild(div);
        });
    }
}

// Navigate to Phase 6
function goToPhase6() {
    try {
        const student = JSON.parse(localStorage.getItem('studentProfile') || '{}');
        student.hasAcceptedCTA = true;
        student.currentPhase = 6;
        localStorage.setItem('studentProfile', JSON.stringify(student));
    } catch {
        // Ignore
    }
    window.location.href = 'futures-abroad-enroll.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('phase5-container')) {
        initPhase5();
    }
});
