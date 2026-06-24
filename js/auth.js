// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function isLoggedIn() {
    return localStorage.getItem('userToken') !== null;
}

function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logoutUser() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ============================================
// SIGNUP FORM
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const school = document.getElementById('signupSchool').value;
            const country = document.getElementById('signupCountry').value;
            const gradeInput = document.querySelector('input[name="grade"]:checked');
            const interests = Array.from(document.querySelectorAll('.tag.active')).map(t => t.dataset.tag);
            
            if (!name || !email || !password || !gradeInput) {
                alert('Please fill all required fields.');
                return;
            }
            
            const user = {
                id: 'user_' + Date.now(),
                name: name,
                email: email,
                grade: gradeInput.value,
                school: school || '',
                country: country || 'UAE',
                interests: interests,
                quizCompleted: false,
                createdAt: new Date().toISOString()
            };
            
            // Save user to localStorage
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Set current user
            localStorage.setItem('userToken', 'token_' + Date.now());
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect to quiz
            window.location.href = 'quiz.html';
        });
    }

    // ============================================
    // STUDENT LOGIN FORM
    // ============================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                alert('Please enter your email and password.');
                return;
            }
            
            // Check users
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);
            
            if (user) {
                localStorage.setItem('userToken', 'token_' + Date.now());
                localStorage.setItem('user', JSON.stringify(user));
                
                if (user.quizCompleted) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'quiz.html';
                }
            } else {
                alert('User not found. Please sign up first.');
            }
        });
    }

    // ============================================
    // PROTECTED ROUTES
    // ============================================
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['dashboard.html', 'quiz.html'];
    const adminPages = ['admin-dashboard.html'];
    
    // Check admin pages
    if (adminPages.includes(currentPage)) {
        if (!isAdmin()) {
            window.location.href = 'admin-login.html';
        }
    }
    
    // Check protected pages
    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        window.location.href = 'login.html';
    }

    // ============================================
    // LOGOUT
    // ============================================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }

    // ============================================
    // ADMIN LOGOUT
    // ============================================
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
        });
    }

    // ============================================
    // USER BADGE
    // ============================================
    const user = getCurrentUser();
    if (user) {
        document.querySelectorAll('#userName, #userBadge').forEach(el => {
            if (el) el.textContent = user.name || 'Student';
        });
    }
});