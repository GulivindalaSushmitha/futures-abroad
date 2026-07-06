// ============================================================
// js/university.js - University Shortlist (Phase 5)
// ============================================================

import { db, auth, COLLECTIONS, collection, doc, getDoc, getDocs, onAuthStateChanged } from './firebase-config.js';

// Sample University Data (fallback if Firestore is empty)
var SAMPLE_UNIVERSITIES = [
    {
        name: 'Massachusetts Institute of Technology',
        country: '🇺🇸 USA',
        programs: ['Computer Science', 'Engineering', 'Data Science'],
        acceptanceRate: '4%',
        interest_tags: ['STEM', 'Computer Science', 'Engineering'],
        gpa_band: [3.8, 4.0],
        notable_for: ['STEM', 'Research', 'Innovation']
    },
    {
        name: 'Harvard University',
        country: '🇺🇸 USA',
        programs: ['Political Science', 'Economics', 'Law', 'Business'],
        acceptanceRate: '3.4%',
        interest_tags: ['Social Sciences', 'Business', 'Law', 'Political Science'],
        gpa_band: [3.8, 4.0],
        notable_for: ['Humanities', 'Social Sciences', 'Law']
    },
    {
        name: 'University of Oxford',
        country: '🇬🇧 UK',
        programs: ['Biology', 'Chemistry', 'Medicine', 'History'],
        acceptanceRate: '17%',
        interest_tags: ['Biology', 'Chemistry', 'Medicine', 'History'],
        gpa_band: [3.7, 4.0],
        notable_for: ['Research', 'Humanities', 'Medicine']
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

// ============================================================
// Generate University Shortlist
// ============================================================
async function generateShortlist(studentInterests, gpa) {
    if (!studentInterests || studentInterests.length === 0) {
        studentInterests = ['STEM', 'Computer Science'];
    }

    try {
        var universitiesRef = collection(db, COLLECTIONS.universities);
        var snapshot = await getDocs(universitiesRef);
        var allUniversities = [];
        snapshot.forEach(function(doc) {
            allUniversities.push({ id: doc.id, ...doc.data() });
        });

        if (allUniversities.length === 0) {
            console.warn('No universities found in Firestore. Using sample data.');
            return generateSampleShortlist(studentInterests, gpa);
        }

        var matches = allUniversities.filter(function(univ) {
            return univ.interest_tags && univ.interest_tags.some(function(tag) {
                return studentInterests.some(function(interest) {
                    return interest.toLowerCase().includes(tag.toLowerCase()) ||
                           tag.toLowerCase().includes(interest.toLowerCase());
                });
            });
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
    return categorizeUniversities(SAMPLE_UNIVERSITIES, studentInterests, gpa);
}

// ============================================================
// Categorize Universities
// ============================================================
function categorizeUniversities(universities, studentInterests, gpa) {
    var gpaNum = parseFloat(gpa) || 3.0;
    var reach = [];
    var target = [];
    var safety = [];

    universities.forEach(function(univ) {
        var minGPA = univ.gpa_band ? univ.gpa_band[0] : 3.0;
        if (minGPA > gpaNum + 0.3) {
            reach.push({ ...univ, category: 'reach' });
        } else if (minGPA > gpaNum) {
            target.push({ ...univ, category: 'target' });
        } else {
            safety.push({ ...univ, category: 'safety' });
        }
    });

    while (reach.length < 2 && target.length > 0) {
        reach.push(target.pop());
    }
    while (target.length < 3 && safety.length > 0) {
        target.push(safety.pop());
    }
    while (safety.length < 2 && target.length > 0) {
        safety.push(target.pop());
    }

    var result = [];
    var typeMap = { reach: 'Reach', target: 'Target', safety: 'Safety' };

    [...reach.slice(0, 2), ...target.slice(0, 3), ...safety.slice(0, 2)].forEach(function(univ) {
        if (univ && !result.find(function(r) { return r.id === univ.id; })) {
            var type = typeMap[univ.category] || 'Target';
            var rationale = generateAIRationale(univ, studentInterests, type);
            result.push({ ...univ, type: type, rationale: rationale });
        }
    });

    return result;
}

// ============================================================
// Generate AI Rationale
// ============================================================
function generateAIRationale(university, studentInterests, type) {
    var interestString = studentInterests.slice(0, 3).join(', ');
    var notableString = university.notable_for ? university.notable_for.slice(0, 3).join(', ') : 'academic excellence';
    var programString = university.programs ? university.programs.slice(0, 3).join(', ') : 'various programs';
    
    return 'Based on your interest in ' + interestString + ', ' + university.name + ' is a ' + type.toLowerCase() + ' option for you. This university is renowned for ' + notableString + ' and offers excellent programs in ' + programString + '. With an acceptance rate of ' + (university.acceptanceRate || 'competitive') + ', it aligns with your academic goals.';
}

// ============================================================
// Render University Shortlist
// ============================================================
async function renderUniversityShortlist() {
    var user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    var container = document.getElementById('shortlistContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p style="color:#888;">Loading your shortlist...</p></div>';

    try {
        var userDoc = await getDoc(doc(db, COLLECTIONS.users, user.uid));
        var profile = userDoc.exists() ? userDoc.data() : {};

        var interests = profile.interests || ['STEM', 'Computer Science'];
        var gpa = profile.gpa || '3.5';

        var shortlist = await generateShortlist(interests, gpa);

        if (shortlist.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No University Matches Found</h3><p>Try updating your interests or GPA in your profile.</p></div>';
            return;
        }

        window._shortlist = shortlist;

        var html = '<div class="university-grid">';
        shortlist.forEach(function(univ) {
            var badgeClass = univ.type.toLowerCase();
            var rationale = univ.rationale || generateAIRationale(univ, interests, univ.type);

            html += '<div class="university-card ' + badgeClass + '">';
            html += '<div class="card-header">';
            html += '<div><div class="university-name">' + univ.name + '</div>';
            html += '<div class="university-meta"><span>📍 ' + (univ.country || 'Global') + '</span><span>🎯 ' + (univ.acceptanceRate || 'Competitive') + '</span></div></div>';
            html += '<span class="type-badge ' + badgeClass + '">' + univ.type + '</span>';
            html += '</div>';
            html += '<div class="programs">';
            (univ.programs || []).slice(0, 4).forEach(function(p) {
                html += '<span class="program-tag">' + p + '</span>';
            });
            html += '</div>';
            html += '<div class="ai-rationale"><span class="ai-icon">🤖</span> ' + rationale + '</div>';
            html += '</div>';
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
    var cards = document.querySelectorAll('.university-card');
    var buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    var activeBtn = document.querySelector('.filter-btn[data-filter="' + category + '"]');
    if (activeBtn) activeBtn.classList.add('active');

    cards.forEach(function(card) {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            var isMatch = card.className.indexOf(category) !== -1;
            card.style.display = isMatch ? 'block' : 'none';
        }
    });
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    onAuthStateChanged(auth, function(user) {
        if (user) {
            renderUniversityShortlist();
        } else {
            window.location.href = 'login.html';
        }
    });

    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterShortlist(btn.dataset.filter);
        });
    });
});

export { generateShortlist, generateAIRationale, renderUniversityShortlist, filterShortlist };
