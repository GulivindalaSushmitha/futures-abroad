// js/dashboard.js
// Enhanced Dashboard with proper activity loading

// Get user data from localStorage (set during signup)
function getUserData() {
    const userData = localStorage.getItem('futuresAbroadUser');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
}

// State
let currentUser = null;
let currentActivities = [];
let currentTypeFilter = 'All Types';
let currentCostFilter = 'All Costs';

// DOM Elements
const activitiesContainer = document.getElementById('activitiesContainer');
const interestTagsContainer = document.getElementById('interestTags');
const userNameDisplay = document.getElementById('userNameDisplay');
const userGradeDisplay = document.getElementById('userGrade');
const userAvatar = document.getElementById('userAvatar');

// Initialize Dashboard
function initDashboard() {
    currentUser = getUserData();
    
    // If no user, redirect to signup
    if (!currentUser) {
        window.location.href = 'signup.html';
        return;
    }

    // Display user info
    userNameDisplay.textContent = currentUser.name || 'Student';
    userGradeDisplay.textContent = `Grade ${currentUser.grade || 10}`;
    userAvatar.textContent = (currentUser.name || 'S')[0].toUpperCase();
    document.getElementById('userName').textContent = currentUser.name || 'Student';

    // Display interest tags
    const interests = currentUser.interests || ['STEM', 'Leadership'];
    displayInterestTags(interests);

    // Load and display activities
    loadActivities();

    // Setup filter buttons
    setupFilters();
}

// Display Interest Tags with Emojis
function displayInterestTags(interests) {
    const tagEmojis = {
        'STEM': '🔬',
        'Leadership': '👑',
        'Community Service': '🤝',
        'Social Enterprise': '🌱',
        'Business': '💼',
        'Entrepreneurship': '🚀',
        'Finance': '💰',
        'Sustainability': '🌍',
        'Environment': '🌿',
        'Computer Science': '💻',
        'Engineering': '⚙️',
        'Data Science': '📊',
        'Technology': '📱',
        'Medicine': '🏥',
        'Biology': '🧬',
        'Public Health': '🩺',
        'Visual Art': '🎨',
        'Graphic Design': '🖌️',
        'Law': '⚖️',
        'Political Science': '🏛️',
        'International Relations': '🌐',
        'AI & Machine Learning': '🤖',
        'Robotics': '⚡',
        'Mental Health': '🧠'
    };

    interestTagsContainer.innerHTML = interests.map(tag => 
        `<span class="interest-tag">
            <span class="tag-icon">${tagEmojis[tag] || '⭐'}</span>
            ${tag}
        </span>`
    ).join('');
}

// Load Activities from the database
function loadActivities() {
    if (!currentUser) {
        console.error('No user found');
        return;
    }
    
    const interests = currentUser.interests || ['STEM', 'Leadership'];
    const grade = parseInt(currentUser.grade) || 10;
    
    // Use the global function from activity-data.js
    let activities = [];
    if (typeof getActivitiesByInterests === 'function') {
        activities = getActivitiesByInterests(interests, grade, {
            type: currentTypeFilter,
            cost: currentCostFilter
        });
    } else {
        console.error('getActivitiesByInterests function not found');
        // Fallback: try to load from window
        if (window.getActivitiesByInterests) {
            activities = window.getActivitiesByInterests(interests, grade, {
                type: currentTypeFilter,
                cost: currentCostFilter
            });
        }
    }
    
    currentActivities = activities;
    renderActivities(activities);
}

// Render Activities
function renderActivities(activities) {
    if (!activities || activities.length === 0) {
        activitiesContainer.innerHTML = `
            <div class="no-activities">
                <div class="empty-icon">🔍</div>
                <h3>No activities found</h3>
                <p>Try adjusting your filters or complete more of the quiz.</p>
                <button class="btn-retake-quiz" onclick="retakeQuiz()">🔄 Retake Interest Quiz</button>
            </div>
        `;
        return;
    }

    const typeColors = {
        'internship': 'internship',
        'competition': 'competition',
        'volunteering': 'volunteering',
        'course': 'course',
        'workshop': 'workshop',
        'summit': 'summit',
        'research': 'research'
    };

    const typeEmojis = {
        'internship': '💼',
        'competition': '🏆',
        'volunteering': '🤝',
        'course': '📚',
        'workshop': '🔧',
        'summit': '🌍',
        'research': '🔬'
    };

    activitiesContainer.innerHTML = `
        <div class="activities-grid">
            ${activities.map((activity, index) => `
                <div class="activity-card" style="animation-delay: ${index * 0.05}s" onclick="showActivityDetail(${activity.id})">
                    <span class="activity-badge ${typeColors[activity.type] || 'course'}">
                        ${typeEmojis[activity.type] || '📌'} ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </span>
                    <h3>${activity.name}</h3>
                    <div class="activity-meta">
                        <span>📅 ${activity.duration}</span>
                        <span>💰 ${activity.cost}</span>
                        <span>📌 ${activity.country}</span>
                    </div>
                    <div class="activity-rationale">
                        <span class="rationale-icon">🧠</span>
                        ${getAIRationale(activity, currentUser)}
                    </div>
                    <div class="activity-tags">
                        ${activity.interest_tags.map(tag => 
                            `<span class="mini-tag">#${tag}</span>`
                        ).join('')}
                    </div>
                    <div class="card-footer">
                        <span class="deadline">
                            ⏰ Deadline: ${formatDate(activity.deadline)}
                            ${isUrgent(activity.deadline) ? ' <span class="urgent">🔴 Urgent</span>' : ''}
                        </span>
                        <button class="btn-register" onclick="event.stopPropagation(); startRegistration(${activity.id})">
                            Register Now →
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate AI Rationale
function getAIRationale(activity, user) {
    // Use the activity's stored rationale if available
    if (activity.ai_rationale) {
        return activity.ai_rationale;
    }
    
    const rationales = {
        'Leadership': `Develops leadership skills essential for university applications and future careers.`,
        'Community Service': `Shows your commitment to making a difference — universities love this!`,
        'Business': `Perfect if you're interested in business and entrepreneurship.`,
        'Sustainability': `Great for students passionate about the environment and leadership.`,
        'STEM': `Builds strong technical skills that top universities look for.`,
        'Medicine': `Great preparation for medical school applications.`,
        'Technology': `Develops future-ready tech skills in high demand.`
    };

    for (const tag of user.interests || []) {
        if (activity.interest_tags.some(at => at.includes(tag) || tag.includes(at))) {
            return rationales[tag] || `Recommended because you're interested in ${tag}.`;
        }
    }
    return `This activity aligns with your interests and goals.`;
}

// Format Date
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

// Check if deadline is urgent (within 2 weeks)
function isUrgent(dateStr) {
    try {
        const deadline = new Date(dateStr);
        const now = new Date();
        const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
        return diffDays <= 14 && diffDays > 0;
    } catch (e) {
        return false;
    }
}

// Setup Filter Buttons
function setupFilters() {
    // Type filters
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTypeFilter = this.dataset.filter;
            loadActivities();
        });
    });

    // Cost filters
    document.querySelectorAll('[data-cost]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-cost]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCostFilter = this.dataset.cost;
            loadActivities();
        });
    });
}

// Show Activity Detail (goes to registration)
function showActivityDetail(activityId) {
    const activity = getActivityById(activityId);
    if (!activity) {
        console.error('Activity not found:', activityId);
        return;
    }
    localStorage.setItem('selectedActivity', JSON.stringify(activity));
    window.location.href = 'activity-registration.html';
}

// Start Registration
function startRegistration(activityId) {
    const activity = getActivityById(activityId);
    if (!activity) {
        console.error('Activity not found:', activityId);
        return;
    }
    localStorage.setItem('selectedActivity', JSON.stringify(activity));
    window.location.href = 'activity-registration.html';
}

// Retake Quiz
function retakeQuiz() {
    if (confirm('Retaking the quiz will update your recommendations. Continue?')) {
        localStorage.removeItem('futuresAbroadUser');
        window.location.href = 'signup.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
