// ============================================================
// js/portfolio.js - Portfolio Management (Phase 4)
// ============================================================

import { 
    db, auth, COLLECTIONS,
    collection, doc, getDoc, getDocs, query, where,
    updateDoc, onAuthStateChanged 
} from './firebase-config.js';

// ============================================================
// MAIN: Load Portfolio Page
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        await loadPortfolio(user.uid);
        await loadProfileStrength(user.uid);
    });
    
    const exportBtn = document.getElementById('exportPDFBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPortfolioPDF);
    }
});

// ============================================================
// Load Portfolio from Firestore
// ============================================================
async function loadPortfolio(userId) {
    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const container = document.getElementById('portfolioGrid');
        if (!container) return;
        
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>No Activities Completed Yet</h3>
                    <p>Complete your first activity to start building your portfolio!</p>
                    <a href="dashboard.html" style="display:inline-block;margin-top:1rem;background:#667eea;color:white;padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;">Browse Activities →</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            
            html += `
                <div class="portfolio-item">
                    <div class="activity-name">${item.activityName || 'Activity'}</div>
                    <div class="activity-meta">${item.type || ''} ${item.duration ? `• ${item.duration}` : ''}</div>
                    <div class="activity-date">✅ Completed: ${item.dateCompleted || 'N/A'}</div>
                    ${item.essayPotentialFlag ? `<span class="essay-badge">📝 Essay Potential</span>` : ''}
                    <div class="skills-tags">
                        ${(item.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                    ${item.studentNote ? `<div class="student-note">💬 ${item.studentNote}</div>` : ''}
                    ${renderReflections(item.reflectionResponses)}
                </div>
            `;
        });
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('portfolioGrid').innerHTML = '<p style="color:red;">Error loading portfolio. Please refresh.</p>';
    }
}

// ============================================================
// Render Reflections
// ============================================================
function renderReflections(reflections) {
    if (!reflections || Object.keys(reflections).length === 0) return '';
    
    let html = '<div class="reflection-prompt"><strong>📝 Reflections:</strong>';
    Object.entries(reflections).forEach(([question, answer]) => {
        html += `
            <div class="reflection-question">${question}</div>
            <div class="reflection-answer">${answer}</div>
        `;
    });
    html += '</div>';
    return html;
}

// ============================================================
// Calculate Profile Strength Score
// ============================================================
function calculateProfileStrength(activities) {
    if (!activities || activities.length === 0) return 0;
    
    let score = 0;
    const now = new Date();
    
    const count = Math.min(activities.length, 5);
    score += (count / 5) * 30;
    
    const types = new Set(activities.map(a => a.type));
    const typeCount = Math.min(types.size, 4);
    score += (typeCount / 4) * 20;
    
    const hasLeadership = activities.some(a => 
        a.skills && a.skills.some(s => 
            ['leadership', 'initiative', 'management', 'coordinator', 'organizer'].includes(s.toLowerCase())
        )
    );
    if (hasLeadership) score += 20;
    
    const recentActivities = activities.filter(a => {
        if (!a.dateCompleted) return false;
        const completed = new Date(a.dateCompleted);
        const monthsDiff = (now - completed) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff <= 12;
    });
    const recencyScore = Math.min(recentActivities.length / 3, 1) * 15;
    score += recencyScore;
    
    const hasReflections = activities.filter(a => 
        a.reflectionResponses && Object.keys(a.reflectionResponses).length > 0
    );
    const reflectionScore = Math.min(hasReflections.length / 3, 1) * 15;
    score += reflectionScore;
    
    return Math.round(Math.min(score, 100));
}

// ============================================================
// Load Profile Strength
// ============================================================
async function loadProfileStrength(userId) {
    try {
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const activities = [];
        querySnapshot.forEach((doc) => activities.push(doc.data()));
        
        const score = calculateProfileStrength(activities);
        
        const scoreElement = document.getElementById('strengthScore');
        const barElement = document.getElementById('strengthBar');
        const labelElement = document.getElementById('strengthLabel');
        const countElement = document.getElementById('activityCount');
        
        if (scoreElement) scoreElement.textContent = score;
        if (barElement) barElement.style.width = score + '%';
        
        let label = '🌱 Just Getting Started';
        if (score >= 80) label = '🎯 University Ready!';
        else if (score >= 60) label = '🏆 Competitive Candidate';
        else if (score >= 40) label = '⭐ Strong Profile';
        else if (score >= 20) label = '📈 Building Momentum';
        if (labelElement) labelElement.textContent = label;
        
        if (countElement) countElement.textContent = activities.length;
        
        window._portfolioActivities = activities;
        window._profileStrength = { score, label };
        
        return score;
    } catch (error) {
        console.error('Error loading profile strength:', error);
        return 0;
    }
}

// ============================================================
// Export Portfolio as PDF
// ============================================================
async function exportPortfolioPDF() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.users, user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const portfolioRef = collection(db, COLLECTIONS.studentPortfolio);
        const q = query(portfolioRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const activities = [];
        snapshot.forEach(doc => activities.push(doc.data()));
        
        const shortlist = window._shortlist || [];
        
        const content = {
            student: {
                name: userData.name || 'Student',
                grade: userData.grade || 'N/A',
                school: userData.school || 'N/A',
                country: userData.country || 'N/A'
            },
            interests: userData.interests || [],
            activities: activities,
            shortlist: shortlist,
            strengthScore: window._profileStrength?.score || 0
        };
        
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Portfolio - ${content.student.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
                        h1 { color: #667eea; }
                        .section { margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
                        .badge { display: inline-block; background: #667eea; color: white; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
                    </style>
                </head>
                <body>
                    <h1>📊 Portfolio Summary</h1>
                    <p><strong>${content.student.name}</strong> • Grade ${content.student.grade} • ${content.student.school}</p>
                    <p>📍 ${content.student.country}</p>
                    
                    <div class="section">
                        <h2>🎯 Interest Profile</h2>
                        ${content.interests.map(i => `<span class="badge">${i}</span>`).join(' ')}
                        <p>Strength Score: <strong>${content.strengthScore}/100</strong></p>
                    </div>
                    
                    <div class="section">
                        <h2>📁 Completed Activities (${content.activities.length})</h2>
                        ${content.activities.map(a => `
                            <div>
                                <strong>${a.activityName}</strong> (${a.type}) - ${a.dateCompleted}
                                ${a.skills ? `<br>Skills: ${a.skills.join(', ')}` : ''}
                            </div>
                        `).join('<hr>')}
                    </div>
                    
                    ${content.shortlist.length > 0 ? `
                        <div class="section">
                            <h2>🏛️ University Shortlist</h2>
                            ${content.shortlist.map(u => `
                                <div><strong>${u.name}</strong> (${u.country}) - ${u.type}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <p style="margin-top:2rem;color:#888;font-size:0.8rem;">
                        Generated on ${new Date().toLocaleDateString()} • Futures Abroad
                    </p>
                    <button onclick="window.print()" style="padding:0.75rem 1.5rem;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">
                        🖨️ Print / Save as PDF
                    </button>
                </body>
            </html>
        `);
        win.document.close();
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

export { 
    loadPortfolio, 
    loadProfileStrength, 
    calculateProfileStrength, 
    exportPortfolioPDF 
};
