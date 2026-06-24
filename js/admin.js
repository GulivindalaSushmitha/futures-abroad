// ============================================
// ADMIN DASHBOARD LOGIC
// ============================================

// Check admin authentication
document.addEventListener('DOMContentLoaded', function() {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
        // Redirect to admin login (you can create a simple login page)
        // For now, we'll allow access
    }
    
    loadDashboard();
});

function loadDashboard() {
    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Update stats
    document.getElementById('totalStudents').textContent = results.length;
    document.getElementById('completedQuizzes').textContent = results.filter(r => r.answeredCount >= 8).length;
    document.getElementById('pendingQuizzes').textContent = results.filter(r => r.answeredCount < 8).length;
    
    const avg = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.answeredCount, 0) / results.length) : 0;
    document.getElementById('avgAnswers').textContent = avg;
    
    // Render table
    const tbody = document.getElementById('resultsBody');
    
    if (results.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--gray);">
                    No student data available yet.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = results.map((r, index) => {
        const status = r.answeredCount >= 8 ? 'Complete' : 'Pending';
        const badgeClass = r.answeredCount >= 8 ? 'badge-complete' : 'badge-pending';
        const date = new Date(r.submittedAt).toLocaleDateString();
        
        // Format answers for preview
        let answersPreview = '';
        if (typeof r.answers === 'object') {
            const keys = Object.keys(r.answers);
            const previewKeys = keys.slice(0, 2);
            answersPreview = previewKeys.map(k => {
                const val = r.answers[k];
                if (Array.isArray(val)) {
                    return val.join(', ');
                }
                return typeof val === 'string' ? val.substring(0, 30) + (val.length > 30 ? '...' : '') : '';
            }).filter(v => v).join(', ');
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${r.userName || 'Unknown'}</strong><br/><small style="color:var(--gray);">${r.userEmail || ''}</small></td>
                <td>Grade ${r.userGrade || 'N/A'}</td>
                <td>${r.userInterests && r.userInterests.length > 0 ? r.userInterests.join(', ') : 'Not specified'}</td>
                <td class="answers-cell">
                    ${answersPreview || 'No answers recorded'}
                </td>
                <td><span class="${badgeClass}">${status} (${r.answeredCount}/${r.questionCount})</span></td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-primary btn-sm view-btn" onclick="viewAnswers(${index})">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// VIEW ANSWERS MODAL
// ============================================
function viewAnswers(index) {
    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const result = results[index];
    
    if (!result) return;
    
    document.getElementById('modalStudentName').textContent = `${result.userName}'s Answers`;
    
    let html = '';
    if (typeof result.answers === 'object') {
        const questionLabels = {
            1: 'Favorite School Subject',
            2: 'Weekend Exploration',
            3: 'World Change Vision',
            4: 'Exciting Activities',
            5: 'Career Interest',
            6: 'Problem to Solve',
            7: 'Learning Environment',
            8: 'Skills to Develop',
            9: 'Motivation',
            10: '10-Year Vision'
        };
        
        Object.keys(result.answers).forEach(key => {
            const val = result.answers[key];
            const label = questionLabels[key] || `Question ${key}`;
            let displayVal = val;
            if (Array.isArray(val)) {
                displayVal = val.join(', ');
            }
            html += `
                <div style="margin-bottom:12px;padding:8px 0;border-bottom:1px solid var(--gray-border);">
                    <strong style="font-size:13px;color:var(--primary);">${label}:</strong>
                    <div style="font-size:14px;margin-top:4px;">${displayVal || 'No answer'}</div>
                </div>
            `;
        });
    }
    
    document.getElementById('modalAnswers').innerHTML = html || 'No answers recorded.';
    document.getElementById('answerModal').classList.add('active');
}

function closeModal() {
    document.getElementById('answerModal').classList.remove('active');
}

// ============================================
// EXPORT DATA
// ============================================
function exportData() {
    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
    
    if (results.length === 0) {
        alert('No data to export.');
        return;
    }
    
    // Create CSV
    let csv = 'Student,Email,Grade,Interests,Answers,Status,Date\n';
    
    results.forEach(r => {
        let answersStr = '';
        if (typeof r.answers === 'object') {
            answersStr = Object.values(r.answers).map(v => 
                Array.isArray(v) ? v.join('; ') : (v || '')
            ).join(' | ');
        }
        const status = r.answeredCount >= 8 ? 'Complete' : 'Pending';
        const date = new Date(r.submittedAt).toLocaleDateString();
        const interests = r.userInterests ? r.userInterests.join('; ') : '';
        
        csv += `"${r.userName || ''}","${r.userEmail || ''}","${r.userGrade || ''}","${interests}","${answersStr}","${status}","${date}"\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `futures-abroad-quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// CLOSE MODAL ON OVERLAY CLICK
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('answerModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
});

// ============================================
// ADMIN LOGOUT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isAdmin');
            window.location.href = 'login.html';
        });
    }
});