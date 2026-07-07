// ============================================================
// js/activities.js - Phase 2: Activity Recommendations
// ============================================================

import { auth, db } from './firebase-config.js';

// ========================================
// GET STUDENT INTERESTS FROM QUIZ
// ========================================
function getStudentInterests() {
    const scores = JSON.parse(localStorage.getItem('quizScores') || '{}');
    const tags = [];
    
    if (scores.medicine > 0) tags.push('Medicine', 'Health', 'Biology');
    if (scores.engineering > 0) tags.push('Computer Science', 'Engineering', 'Technology', 'AI');
    if (scores.science > 0) tags.push('Research', 'Science', 'Chemistry', 'Physics');
    if (scores.arts > 0) tags.push('Visual Art', 'Design', 'Music', 'Film');
    if (scores.business > 0) tags.push('Entrepreneurship', 'Business', 'Finance', 'Marketing');
    if (scores.environment > 0) tags.push('Sustainability', 'Environment', 'Climate Change');
    if (scores.leadership > 0) tags.push('Leadership', 'Community Service', 'Social Impact');
    if (scores.technology > 0) tags.push('AI', 'Cybersecurity', 'App Development', 'Blockchain');
    
    return tags.length > 0 ? tags : ['Leadership', 'Community Service', 'Technology'];
}

// ========================================
// LOAD ACTIVITIES FROM FIRESTORE
// ========================================
async function loadActivities() {
    const studentGrade = getStudentGrade();
    const interests = getStudentInterests();
    
    const grid = document.getElementById('activityCardsGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6C3CE1;">
                <div style="font-size: 40px; margin-bottom: 15px;">⏳</div>
                <div style="font-weight: 600;">Loading activities...</div>
            </div>
        `;
    }
    
    try {
        const activitiesRef = db.collection('activities');
        const snapshot = await activitiesRef
            .where('grade_min', '<=', studentGrade)
            .where('grade_max', '>=', studentGrade)
            .get();
        
        let activities = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            const matchCount = (data.interest_tags || []).filter(tag => 
                interests.some(interest => 
                    tag.toLowerCase().includes(interest.toLowerCase()) || 
                    interest.toLowerCase().includes(tag.toLowerCase())
                )
            ).length;
            data.matchScore = data.interest_tags.length > 0 ? 
                matchCount / data.interest_tags.length : 0;
            activities.push(data);
        });
        
        activities.sort((a, b) => b.matchScore - a.matchScore);
        const topActivities = activities.slice(0, 8);
        
        window.allActivities = activities;
        
        renderActivityCards(topActivities);
    } catch (error) {
        console.error('Error loading activities:', error);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 40px; margin-bottom: 15px;">⚠️</div>
                    <h3 style="color: #2D1B4E;">Unable to load activities</h3>
                    <p style="color: #666; margin: 10px 0;">Please make sure you have activities in your Firestore database.</p>
                    <button onclick="seedActivities()" class="btn-primary" style="margin-top: 15px; padding: 12px 24px;">
                        🚀 Seed Sample Activities
                    </button>
                    <br>
                    <button onclick="loadActivities()" class="btn-secondary" style="margin-top: 10px; padding: 10px 20px;">
                        🔄 Try Again
                    </button>
                </div>
            `;
        }
    }
}

function getStudentGrade() {
    const storedGrade = localStorage.getItem('studentGrade');
    if (storedGrade) return parseInt(storedGrade);
    return 10;
}

function renderActivityCards(activities) {
    const grid = document.getElementById('activityCardsGrid');
    
    if (!grid) return;
    
    if (!activities || activities.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8f4ff; border-radius: 20px;">
                <div style="font-size: 48px;">🔍</div>
                <h3 style="color: #2D1B4E; margin: 15px 0;">No activities found</h3>
                <p style="color: #666; max-width: 400px; margin: 0 auto 15px;">
                    Try broadening your interests or check back later for new opportunities.
                </p>
                <button onclick="loadActivities()" class="btn-primary" style="padding: 10px 24px;">🔄 Refresh</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = activities.map((activity, index) => `
        <div onclick="showActivityDetail('${activity.id}')" 
             style="background: white; border-radius: 20px; padding: 25px; 
                    box-shadow: 0 10px 30px rgba(108,60,225,0.08); 
                    border: 2px solid ${activity.matchScore > 0.5 ? '#6C3CE1' : '#f0e6ff'}; 
                    transition: all 0.3s; cursor: pointer; position: relative;
                    animation: fadeInUp 0.5s ease ${index * 0.1}s both;">
            
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <span style="background: ${activity.matchScore > 0.5 ? '#6C3CE1' : '#FFD93D'}; 
                             color: ${activity.matchScore > 0.5 ? 'white' : '#2D1B4E'}; 
                             padding: 4px 14px; border-radius: 50px; font-size: 12px; font-weight: 700;">
                    ${activity.type || 'Activity'}
                </span>
                <span style="color: #888; font-size: 14px; font-weight: 600;">
                    ${activity.matchScore > 0.5 ? '🔥 Top Match' : '💡 Good Fit'}
                </span>
            </div>
            
            <h3 style="font-size: 20px; color: #2D1B4E; margin: 10px 0 8px;">${activity.name}</h3>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 14px; color: #555; margin-bottom: 12px;">
                <span>⏱️ ${activity.duration || 'N/A'}</span>
                <span>💰 ${activity.cost || 'Free'}</span>
                <span>📅 ${activity.deadline ? new Date(activity.deadline).toLocaleDateString() : 'Rolling'}</span>
            </div>
            
            <div style="background: #f8f4ff; border-radius: 12px; padding: 12px; font-size: 14px; color: #555; border-left: 4px solid #6C3CE1; margin-bottom: 12px;">
                <strong style="color: #6C3CE1;">✨ Why this fits you:</strong> 
                ${activity.rationale || 'Based on your interests and goals.'}
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                ${(activity.interest_tags || []).slice(0, 3).map(tag => 
                    `<span style="background: #f0e6ff; color: #6C3CE1; padding: 3px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">#${tag}</span>`
                ).join('')}
                ${(activity.interest_tags || []).length > 3 ? 
                    `<span style="font-size: 12px; color: #888;">+${(activity.interest_tags || []).length - 3} more</span>` : ''}
            </div>
            
            <!-- Register button navigates to Phase 3 -->
            <button onclick="event.stopPropagation(); navigateToPhase3('${activity.id}')" 
                    class="btn-primary" style="width: 100%; margin-top: 15px; padding: 12px; font-size: 14px;">
                📝 Register Now
            </button>
        </div>
    `).join('');
    
    if (!document.getElementById('phase2Styles')) {
        const style = document.createElement('style');
        style.id = 'phase2Styles';
        style.textContent = `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// NAVIGATE TO PHASE 3 - ACTIVITY REGISTRATION
// ========================================
function navigateToPhase3(activityId) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in first to register for activities.');
        window.location.href = 'login.html';
        return;
    }
    window.location.href = `activity-registration.html?id=${activityId}`;
}

// ========================================
// SHOW ACTIVITY DETAIL IN MODAL
// ========================================
async function showActivityDetail(activityId) {
    try {
        const doc = await db.collection('activities').doc(activityId).get();
        const activity = doc.data();
        
        if (!activity) {
            alert('Activity not found.');
            return;
        }
        
        const modal = document.getElementById('activityDetailModal');
        const content = document.getElementById('activityDetailContent');
        
        if (!modal || !content) return;
        
        content.innerHTML = `
            <div style="position: sticky; top: 0; background: white; padding-bottom: 15px; margin-bottom: 20px; border-bottom: 2px solid #f0e6ff;">
                <h2 style="color: #2D1B4E; font-size: 28px; margin-bottom: 5px;">${activity.name}</h2>
                <span style="background: #6C3CE1; color: white; padding: 4px 18px; border-radius: 50px; font-size: 14px; font-weight: 700; display: inline-block;">
                    ${activity.type || 'Activity'}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; padding: 15px; background: #f8f4ff; border-radius: 16px;">
                <div><strong>📍 Location:</strong> ${activity.country || 'Global'}</div>
                <div><strong>⏱️ Duration:</strong> ${activity.duration || 'N/A'}</div>
                <div><strong>💰 Cost:</strong> ${activity.cost || 'Free'}</div>
                <div><strong>📅 Deadline:</strong> ${activity.deadline ? new Date(activity.deadline).toLocaleDateString() : 'Rolling'}</div>
                <div style="grid-column: 1/-1;"><strong>🎓 Grades:</strong> ${activity.grade_min || 10} - ${activity.grade_max || 12}</div>
            </div>
            
            <div style="margin: 20px 0;">
                <h4 style="color: #2D1B4E; margin-bottom: 8px;">📝 Description</h4>
                <p style="color: #555; line-height: 1.6;">${activity.description || 'No description available.'}</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h4 style="color: #2D1B4E; margin-bottom: 8px;">🎯 Skills You'll Gain</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${(activity.skills_gained || []).map(skill => 
                        `<span style="background: #f0e6ff; color: #6C3CE1; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: 600;">${skill}</span>`
                    ).join('') || '<span style="color: #888;">No skills listed yet.</span>'}
                </div>
            </div>
            
            <div style="margin: 20px 0; background: #f8f4ff; border-radius: 16px; padding: 15px;">
                <h4 style="color: #2D1B4E; margin-bottom: 8px;">🤖 AI Assistant</h4>
                <p style="color: #555; font-size: 14px;">Ask about this activity:</p>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="aiQuestion" 
                           placeholder="e.g., Is this right for me?" 
                           style="flex: 1; min-width: 200px; padding: 12px 16px; border: 2px solid #e8e0f0; border-radius: 50px; font-family: 'Quicksand', sans-serif;">
                    <button onclick="askAIAboutActivity('${activity.id}')" 
                            class="btn-primary" style="padding: 10px 24px;">
                        Ask AI
                    </button>
                </div>
                <div id="aiResponse" style="margin-top: 12px; padding: 12px; background: white; border-radius: 12px; display: none; border-left: 4px solid #6C3CE1;"></div>
            </div>
            
            <button onclick="navigateToPhase3('${activity.id}')" 
                    class="btn-primary" style="width: 100%; padding: 16px; font-size: 18px; margin-top: 10px;">
                📝 Register for This Activity
            </button>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading activity detail:', error);
        alert('Unable to load activity details.');
    }
}

function closeActivityDetail() {
    const modal = document.getElementById('activityDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// AI Q&A FOR ACTIVITIES
// ========================================
async function askAIAboutActivity(activityId) {
    const questionInput = document.getElementById('aiQuestion');
    const responseDiv = document.getElementById('aiResponse');
    
    if (!questionInput || !responseDiv) return;
    
    const question = questionInput.value.trim();
    if (!question) {
        alert('Please ask a question first.');
        return;
    }
    
    try {
        const doc = await db.collection('activities').doc(activityId).get();
        const activity = doc.data();
        
        if (!activity) {
            responseDiv.style.display = 'block';
            responseDiv.innerHTML = '⚠️ Activity data not found.';
            return;
        }
        
        const responses = {
            'right': `Based on your interest in ${(activity.interest_tags || []).join(', ')}, ${activity.name} is an excellent match! This activity is specifically designed for students in Grade ${activity.grade_min}-${activity.grade_max}, and it will help you develop ${(activity.skills_gained || []).join(', ')}. The ${activity.cost || 'free'} registration and ${activity.duration || 'flexible'} schedule make it very accessible. I'd say this is a great fit for your profile!`,
            'learn': `In ${activity.name}, you will learn: ${(activity.skills_gained || []).join(', ')}. Additionally, you'll gain practical experience in ${(activity.interest_tags || []).slice(0, 3).join(', ')}. Past participants have found this activity to be transformative for their university applications.`,
            'hard': `The application for ${activity.name} is competitive but accessible. You'll need to prepare a personal statement. The deadline is ${activity.deadline ? new Date(activity.deadline).toLocaleDateString() : 'rolling'}, so I'd recommend starting your application at least 2 weeks before. Need help with your application? I can guide you through it!`
        };
        
        let response = responses['right'];
        
        const lowerQ = question.toLowerCase();
        if (lowerQ.includes('learn') || lowerQ.includes('gain')) {
            response = responses['learn'];
        } else if (lowerQ.includes('hard') || lowerQ.includes('difficult') || lowerQ.includes('competition')) {
            response = responses['hard'];
        } else if (lowerQ.includes('right') || lowerQ.includes('fit') || lowerQ.includes('good')) {
            response = responses['right'];
        } else {
            response = `Great question about ${activity.name}! Here's what I can tell you: This ${activity.type || 'activity'} focuses on ${(activity.interest_tags || []).join(', ')}. It runs for ${activity.duration || 'a specified period'} and is ${activity.cost || 'free'}. If you have more specific questions, feel free to ask!`;
        }
        
        responseDiv.style.display = 'block';
        responseDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: start;">
                <span style="font-size: 24px;">🤖</span>
                <div>
                    <strong style="color: #6C3CE1;">AI Response:</strong>
                    <p style="margin-top: 8px; color: #333; line-height: 1.6;">${response}</p>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        responseDiv.style.display = 'block';
        responseDiv.innerHTML = '⚠️ Unable to get AI response. Please try again.';
    }
}

// ========================================
// FILTER ACTIVITIES
// ========================================
function filterActivities() {
    const type = document.getElementById('filterType')?.value || 'all';
    const cost = document.getElementById('filterCost')?.value || 'all';
    
    const cards = document.querySelectorAll('#activityCardsGrid > div');
    cards.forEach(card => {
        let show = true;
        
        if (type !== 'all') {
            const cardType = card.querySelector('span:first-child')?.textContent || '';
            if (cardType.toLowerCase() !== type) show = false;
        }
        
        if (cost !== 'all') {
            const cardCost = card.querySelector('span:nth-child(2)')?.textContent || '';
            if (!cardCost.includes(cost)) show = false;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

// ========================================
// REFRESH RECOMMENDATIONS
// ========================================
async function refreshRecommendations() {
    const button = event?.target;
    if (button) {
        const originalText = button.textContent;
        button.textContent = '🔄 Loading...';
        button.disabled = true;
        await loadActivities();
        button.textContent = '✅ Refreshed!';
        button.disabled = false;
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    } else {
        await loadActivities();
    }
}

// ========================================
// SEED SAMPLE ACTIVITIES
// ========================================
async function seedActivities() {
    const activities = [
        {
            name: "Dubai Youth Sustainability Summit",
            type: "competition",
            interest_tags: ["Sustainability", "Environment", "Leadership"],
            grade_min: 10,
            grade_max: 12,
            country: "UAE",
            cost: "Free",
            duration: "3 days",
            deadline: "2026-08-15",
            skills_gained: ["Public Speaking", "Project Management", "Research"],
            description: "Compete with students across the UAE to solve real-world sustainability challenges. Work in teams to develop innovative solutions for a greener future.",
            registration_url: "https://example.com/register-sustainability",
            rationale: "Perfect for students passionate about the environment and leadership.",
            registrationRequirements: [
                { id: "req1", title: "Personal Statement", description: "Write a 250-word statement about your interest in sustainability", dueDate: "2026-08-01" },
                { id: "req2", title: "Teacher Recommendation", description: "Ask a teacher to submit a recommendation", dueDate: "2026-08-05" },
                { id: "req3", title: "Parent Consent", description: "Get parent/guardian permission", dueDate: "2026-08-10" }
            ]
        },
        {
            name: "Future Tech Internship",
            type: "internship",
            interest_tags: ["Computer Science", "Technology", "AI", "Engineering"],
            grade_min: 11,
            grade_max: 12,
            country: "UAE",
            cost: "Paid",
            duration: "4 weeks",
            deadline: "2026-07-30",
            skills_gained: ["Python", "Machine Learning", "Data Analysis", "Team Collaboration"],
            description: "Join a leading tech company in Dubai for a hands-on internship working on real AI projects.",
            registration_url: "https://example.com/register-tech",
            rationale: "Great opportunity to gain practical tech experience and explore AI careers.",
            registrationRequirements: [
                { id: "req1", title: "CV/Resume", description: "Submit your updated CV", dueDate: "2026-07-15" },
                { id: "req2", title: "Cover Letter", description: "Explain why you want this internship", dueDate: "2026-07-20" },
                { id: "req3", title: "Technical Assessment", description: "Complete a short coding challenge", dueDate: "2026-07-25" }
            ]
        },
        {
            name: "Community Leadership Workshop",
            type: "workshop",
            interest_tags: ["Leadership", "Community Service", "Social Enterprise"],
            grade_min: 10,
            grade_max: 12,
            country: "UAE",
            cost: "Free",
            duration: "2 days",
            deadline: "2026-09-01",
            skills_gained: ["Team Management", "Event Planning", "Communication"],
            description: "Learn how to lead community projects and create social impact in your neighborhood.",
            registration_url: "https://example.com/register-leadership",
            rationale: "Develops leadership skills essential for university applications.",
            registrationRequirements: [
                { id: "req1", title: "Application Form", description: "Fill out the workshop application", dueDate: "2026-08-20" },
                { id: "req2", title: "Parent Consent", description: "Get parent/guardian permission", dueDate: "2026-08-25" }
            ]
        },
        {
            name: "Medical Research Summer Program",
            type: "course",
            interest_tags: ["Medicine", "Biology", "Research", "Health"],
            grade_min: 11,
            grade_max: 12,
            country: "Global",
            cost: "Scholarship available",
            duration: "6 weeks",
            deadline: "2026-05-15",
            skills_gained: ["Lab Skills", "Scientific Writing", "Critical Thinking"],
            description: "An intensive summer research program where you'll work in university labs on actual medical research projects.",
            registration_url: "https://example.com/register-medical",
            rationale: "Excellent preparation for medical school applications.",
            registrationRequirements: [
                { id: "req1", title: "Academic Transcript", description: "Submit your latest grades", dueDate: "2026-04-30" },
                { id: "req2", title: "Personal Statement", description: "Explain your interest in medical research", dueDate: "2026-05-01" },
                { id: "req3", title: "Teacher Recommendation", description: "Ask a science teacher to recommend you", dueDate: "2026-05-05" }
            ]
        },
        {
            name: "Global Entrepreneurship Challenge",
            type: "competition",
            interest_tags: ["Business", "Entrepreneurship", "Finance", "Leadership"],
            grade_min: 10,
            grade_max: 12,
            country: "Global",
            cost: "Free",
            duration: "2 months",
            deadline: "2026-10-01",
            skills_gained: ["Business Planning", "Pitching", "Financial Modeling"],
            description: "Pitch your business idea to a panel of investors from around the world.",
            registration_url: "https://example.com/register-business",
            rationale: "Perfect if you're interested in business and entrepreneurship.",
            registrationRequirements: [
                { id: "req1", title: "Business Plan", description: "Submit a 1-page business plan", dueDate: "2026-09-15" },
                { id: "req2", title: "Pitch Deck", description: "Create a 5-slide pitch deck", dueDate: "2026-09-20" },
                { id: "req3", title: "Video Introduction", description: "Record a 2-minute video introducing yourself", dueDate: "2026-09-25" }
            ]
        }
    ];
    
    console.log('🚀 Seeding activities...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const activity of activities) {
        try {
            await db.collection('activities').add(activity);
            console.log(`✅ Added: ${activity.name}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to add: ${activity.name}`, error);
            errorCount++;
        }
    }
    
    console.log(`\n📊 Seeding complete! ${successCount} added, ${errorCount} failed.`);
    
    if (successCount > 0) {
        alert(`🎉 Successfully added ${successCount} sample activities to your Firestore database!\n\nClick OK to refresh the activity feed.`);
        loadActivities();
    } else {
        alert('❌ No activities were added. Please check your Firebase permissions and try again.');
    }
}

// ========================================
// INITIALIZATION
// ========================================
window.getStudentInterests = getStudentInterests;
window.loadActivities = loadActivities;
window.getStudentGrade = getStudentGrade;
window.renderActivityCards = renderActivityCards;
window.showActivityDetail = showActivityDetail;
window.closeActivityDetail = closeActivityDetail;
window.askAIAboutActivity = askAIAboutActivity;
window.navigateToPhase3 = navigateToPhase3;
window.filterActivities = filterActivities;
window.refreshRecommendations = refreshRecommendations;
window.seedActivities = seedActivities;

console.log('🎯 Phase 2: Activity Recommendations loaded!');
console.log('📌 Use seedActivities() to add sample activities to Firestore.');
