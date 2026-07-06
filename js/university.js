// ============================================================
// js/university.js - University Shortlist (Phase 5)
// ============================================================

import { 
    db, auth, COLLECTIONS,
    collection, doc, getDoc, getDocs, onAuthStateChanged 
} from './firebase-config.js';

// ============================================================
// Generate University Shortlist
// ============================================================
async function generateShortlist(studentInterests, gpa) {
    if (!studentInterests || studentInterests.length === 0) {
        studentInterests = ['STEM', 'Computer Science'];
    }
    
    try {
        // Get universities from Firestore
        const universitiesRef = collection(db, COLLECTIONS.universities);
        const snapshot = await getDocs(universitiesRef);
        const allUniversities = [];
        snapshot.forEach(doc => allUniversities.push({ id: doc.id, ...doc.data() }));
        
        if (allUniversities.length === 0) {
            console.warn('No universities found in Firestore. Using sample data.');
            // Fallback to sample data
            return generateSampleShortlist(studentInterests, gpa);
        }
        
        // Filter by interest tags
        let matches = allUniversities.filter(univ => {
            return univ.interest_tags && univ.interest_tags.some(tag => 
                studentInterests.some(interest => 
                    interest.toLowerCase().includes(tag.toLowerCase()) ||
                    tag.toLowerCase().includes(interest.toLowerCase())
                )
            );
        });
        
        if (matches.length === 0) {
            matches = allUniversities.slice(0, 6);
        }
        
        return categorizeUniversities(matches, studentInterests, gpa);
        
    } catch (error) {
        console.error('Error fetching universities:', error);
        return generateSampleShortlist(studentInterests, gpa);
    }
}

// ============================================================
// Sample Shortlist (Fallback)
// ============================================================
function generateSampleShortlist(studentInterests, gpa) {
    const sampleUniversities = [
        {
            name: 'Massachusetts Institute of Technology',
            country: '🇺🇸 USA',
            programs: ['Computer Science', 'Engineering'],
            acceptanceRate: '4%',
            interest_tags: ['STEM', 'Computer Science'],
            gpa_band: [3.8, 4.0],
            notable_for: ['STEM', 'Research']
        },
        {
            name: 'Harvard University',
            country: '🇺🇸 USA',
            programs: ['Political Science', 'Economics', 'Law'],
            acceptanceRate: '3.4%',
            interest_tags: ['Social Sciences', 'Business'],
            gpa_band: [3.8, 4.0],
            notable_for: ['Humanities', 'Social Sciences']
        },
        {
            name: 'University of Oxford',
            country: '🇬🇧 UK',
            programs: ['Biology', 'Chemistry', 'Medicine', 'History'],
            acceptanceRate: '17%',
            interest_tags: ['Biology', 'Chemistry', 'Medicine', 'History'],
            gpa_band: [3.7, 4.0],
            notable_for: ['Research', 'Humanities']
        },
        {
            name: 'National University of Singapore',
            country: '🇸🇬 Singapore',
            programs: ['Computer Science', 'Engineering', 'Medicine'],
            acceptanceRate: '5%',
            interest_tags: ['STEM', 'Medicine', 'Computer Science'],
            gpa_band: [3.6, 4.0],
            notable_for: ['STEM', 'Research', 'Asia']
        },
        {
            name: 'Stanford University',
            country: '🇺🇸 USA',
            programs: ['Computer Science', 'Business', 'Psychology'],
            acceptanceRate: '3.7%',
            interest_tags: ['Computer Science', 'Business', 'Psychology'],
            gpa_band: [3.8, 4.0],
            notable_for: ['Tech', 'Entrepreneurship']
        },
        {
            name: 'Imperial College London',
            country: '🇬🇧 UK',
            programs: ['Engineering', 'Medicine', 'Computer Science'],
            acceptanceRate: '14%',
            interest_tags: ['Engineering', 'Medicine', 'Computer Science'],
            gpa_band: [3.6, 4.0],
            notable_for: ['STEM', 'Research']
        }
    ];
    
    return categorizeUniversities(sampleUniversities, studentInterests, gpa);
}

// ============================================================
// Categorize Universities
// ============================================================
function categorizeUniversities(universities, studentInterests, gpa) {
    const gpaNum = parseFloat(gpa) || 3.0;
    let reach = [];
    let target = [];
    let safety = [];
    
    universities.forEach(univ => {
        const [minGPA] = univ.gpa_band || [3.0, 4.0];
        if (minGPA > gpaNum + 0.3) {
            reach.push({ ...univ, category: 'reach' });
        } else if (minGPA > gpaNum) {
            target.push({ ...univ, category: 'target' });
        } else {
            safety.push({ ...univ, category: 'safety' });
        }
    });
    
    // Ensure we have enough
    while (reach.length < 2 && target.length > 0) {
        reach.push(target.pop());
    }
    while (target.length < 3 && safety.length > 0) {
        target.push(safety.pop());
    }
    while (safety.length < 2 && target.length > 0) {
        safety.push(target.pop());
    }
    
    // Build final list
    const result = [];
    const typeMap = { reach: 'Reach', target: 'Target', safety: 'Safety' };
    
    [...reach.slice(0, 2), ...target.slice(0, 3), ...safety.slice(0, 2)].forEach(univ => {
        if (univ && !result.find(r => r.id === univ.id)) {
            const type = typeMap[univ.category] || 'Target';
            const rationale = generateAIRationale(univ, studentInterests, type);
            result.push({ 
                ...univ, 
                type: type,
                rationale: rationale
            });
        }
    });
    
    return result;
}

// ============================================================
// Generate AI Rationale
// ============================================================
function generateAIRationale(university, studentInterests, type) {
    const interestString = studentInterests.slice(0, 3).join(', ');
    const notableString = university.notable_for ? university.notable_for.slice(0, 3).join(', ') : 'academic excellence';
    const programString = university.programs ? university.programs.slice(0, 3).join(', ') : 'various programs';
    
    return `Based on your interest in ${interestString}, ${university.name} is a ${type.toLowerCase()} option for you. 
        This university is renowned for ${notableString} and offers excellent programs in ${programString}. 
        With an acceptance rate of ${university.acceptanceRate || 'competitive'}, it aligns with your academic goals.`;
}

// ============================================================
// Render University Shortlist
// ============================================================
async function renderUniversityShortlist() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const container = document.getElementById('shortlistContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;padding:2rem;">Loading your shortlist...</div>';
    
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.users, user.uid));
        const profile = userDoc.exists() ? userDoc.data() : {};
        
        const interests = profile.interests || ['STEM', 'Computer Science'];
        const gpa = profile.gpa || '3.5';
        
        const shortlist = await generateShortlist(interests, gpa);
        
        if (shortlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align:center;padding:3rem;">
                    <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
                    <h3>No University Matches Found</h3>
                    <p>Try updating your interests or GPA in your profile.</p>
                </div>
            `;
            return;
        }
        
        window._shortlist = shortlist;
        
        let html = '<div class="university-grid">';
        shortlist.forEach(univ => {
            const badgeClass = univ.type.toLowerCase();
            const rationale = univ.rationale || generateAIRationale(univ, interests, univ.type);
            
            html += `
                <div class="university-card ${badgeClass}">
                    <div class="card-header">
                        <div>
                            <div class="university-name">${univ.name}</div>
                            <div class="university-meta">
                                <span>📍 ${univ.country || 'Global'}</span>
                                <span>🎯 ${univ.acceptanceRate || 'Competitive'}</span>
                            </div>
                        </div>
                        <span class="type-badge ${badgeClass}">${univ.type}</span>
                    </div>
                    <div class="programs">
                        ${(univ.programs || []).slice(0, 4).map(p => `<span class="program-tag">${p}</span>`).join('')}
                    </div>
                    <div class="ai-rationale">
                        <span class="ai-icon">🤖</span> ${rationale}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error rendering shortlist:', error);
        container.innerHTML = '<p style="color:red;">Error loading shortlist. Please refresh.</p>';
    }
}

// ============================================================
// Filter Shortlist
// ============================================================
function filterShortlist(category) {
    const cards = document.querySelectorAll('.university-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    cards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            const isMatch = card.className.includes(category);
            card.style.display = isMatch ? 'block' : 'none';
        }
    });
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            renderUniversityShortlist();
        } else {
            window.location.href = 'login.html';
        }
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterShortlist(btn.dataset.filter);
        });
    });
    
    const ctaBtn = document.getElementById('futuresAbroadCTA');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            window.location.href = 'futures-abroad-enroll.html';
        });
    }
});

export { 
    generateShortlist, 
    generateAIRationale, 
    renderUniversityShortlist,
    filterShortlist
};
