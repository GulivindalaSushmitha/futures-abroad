// ============================================================
// js/admin.js - Admin Dashboard Logic (FULLY FIXED)
// ============================================================

const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================
// CHECK AUTH STATUS
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Check if user is admin
            db.collection('admins').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    loadDashboard();
                } else {
                    auth.signOut().then(() => {
                        window.location.href = 'admin-login.html';
                    });
                }
            }).catch(() => {
                auth.signOut().then(() => {
                    window.location.href = 'admin-login.html';
                });
            });
        } else {
            window.location.href = 'admin-login.html';
        }
    });

    // Navigation
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const section = this.dataset.section;
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${section}`).classList.add('active');
        });
    });
});

// ============================================================
// LOGOUT - FIXED
// ============================================================
window.logout = function() {
    auth.signOut().then(() => {
        console.log('✅ Logged out successfully');
        window.location.href = 'admin-login.html';
    }).catch((error) => {
        console.error('❌ Logout error:', error);
        window.location.href = 'admin-login.html';
    });
};

// ============================================================
// LOAD DASHBOARD
// ============================================================
async function loadDashboard() {
    try {
        // Get ALL students
        const studentsSnapshot = await db.collection('students').get();
        const allStudents = [];
        studentsSnapshot.forEach(doc => {
            allStudents.push({ id: doc.id, ...doc.data() });
        });
        
        // Update stats
        document.getElementById('total-students').textContent = allStudents.length;
        
        // Count students with interests (quiz completed)
        const quizCompleted = allStudents.filter(s => s.interests && s.interests.length > 0);
        document.getElementById('completed-quiz').textContent = quizCompleted.length;
        
        // Count students with university shortlist
        const hasShortlist = allStudents.filter(s => s.universities && s.universities.length > 0);
        document.getElementById('university-shortlists').textContent = hasShortlist.length;
        
        // Activities count
        const activitiesSnapshot = await db.collection('activities').get();
        document.getElementById('active-activities').textContent = activitiesSnapshot.size;
        
        // ===== RECENT STUDENT SIGN-UPS =====
        const tbody = document.getElementById('recent-students');
        tbody.innerHTML = '';
        
        // Sort by createdAt (newest first) and take first 5
        const sortedStudents = allStudents
            .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
                return dateB - dateA;
            })
            .slice(0, 5);
        
        if (sortedStudents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;color:#999;padding:30px;">
                        😕 No students registered yet
                    </td>
                </tr>
            `;
        } else {
            sortedStudents.forEach(data => {
                const name = data.name || data.email || 'Unknown Student';
                const grade = data.grade || 'N/A';
                const interests = Array.isArray(data.interests) 
                    ? data.interests.join(', ') 
                    : (data.interests || 'Not set');
                const status = data.profileCompleted ? '✅ Complete' : '⏳ Pending';
                const joined = data.createdAt 
                    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() 
                    : 'Today';
                
                tbody.innerHTML += `
                    <tr>
                        <td>${name}</td>
                        <td>${grade}</td>
                        <td>${interests}</td>
                        <td>${status}</td>
                        <td>${joined}</td>
                    </tr>
                `;
            });
        }
        
        console.log(`✅ Dashboard loaded: ${allStudents.length} students`);
        
        // Load other sections
        loadStudents();
        loadActivities();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('recent-students').innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#e74c3c;padding:20px;">
                    ❌ Error loading data: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ============================================================
// LOAD STUDENTS
// ============================================================
async function loadStudents() {
    try {
        const snapshot = await db.collection('students').get();
        const tbody = document.getElementById('students-list');
        tbody.innerHTML = '';
        
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            count++;
            const name = data.name || data.email || 'Unknown';
            const email = data.email || 'N/A';
            const grade = data.grade || 'N/A';
            const interests = Array.isArray(data.interests) 
                ? data.interests.join(', ') 
                : (data.interests || 'Not set');
            const phase = data.phase || data.onboardingPhase || 'Phase 1';
            
            tbody.innerHTML += `
                <tr>
                    <td>${name}</td>
                    <td>${email}</td>
                    <td>${grade}</td>
                    <td>${interests}</td>
                    <td>${phase}</td>
                    <td>
                        <button onclick="viewStudent('${doc.id}')" class="btn-sm">👁️ View</button>
                        <button onclick="deleteStudent('${doc.id}')" class="btn-sm btn-danger">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        if (count === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:#999;padding:30px;">
                        😕 No students found
                    </td>
                </tr>
            `;
        }
        
        console.log(`✅ Loaded ${count} students`);
        
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// ============================================================
// LOAD ACTIVITIES
// ============================================================
async function loadActivities() {
    try {
        const snapshot = await db.collection('activities').get();
        const tbody = document.getElementById('activities-list');
        tbody.innerHTML = '';
        
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            count++;
            const interests = Array.isArray(data.interest_tags) 
                ? data.interest_tags.join(', ') 
                : (data.interests || 'N/A');
            const gradeRange = data.grade_min && data.grade_max 
                ? `${data.grade_min} - ${data.grade_max}` 
                : (data.grade || 'All');
            const status = data.active !== false ? '✅ Active' : '⏸️ Inactive';
            
            tbody.innerHTML += `
                <tr>
                    <td>${data.name || 'Unnamed'}</td>
                    <td>${data.type || 'General'}</td>
                    <td>${interests}</td>
                    <td>${gradeRange}</td>
                    <td>${status}</td>
                    <td>
                        <button onclick="editActivity('${doc.id}')" class="btn-sm">✏️ Edit</button>
                        <button onclick="deleteActivity('${doc.id}')" class="btn-sm btn-danger">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        if (count === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:#999;padding:30px;">
                        😕 No activities found. Add your first activity!
                    </td>
                </tr>
            `;
        }
        
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// ============================================================
// STUDENT FUNCTIONS
// ============================================================
function viewStudent(id) {
    window.location.href = `student-detail.html?id=${id}`;
}

async function deleteStudent(id) {
    if (confirm('⚠️ Are you sure you want to delete this student permanently?')) {
        try {
            await db.collection('students').doc(id).delete();
            alert('✅ Student deleted successfully!');
            loadDashboard();
        } catch (error) {
            alert('Failed to delete student: ' + error.message);
        }
    }
}

// ============================================================
// ACTIVITY FUNCTIONS
// ============================================================
async function deleteActivity(id) {
    if (confirm('⚠️ Are you sure you want to delete this activity?')) {
        try {
            await db.collection('activities').doc(id).delete();
            alert('✅ Activity deleted successfully!');
            loadActivities();
            loadDashboard();
        } catch (error) {
            alert('Failed to delete activity: ' + error.message);
        }
    }
}

function showAddActivity() {
    const name = prompt('Enter activity name:');
    if (!name) return;
    
    const type = prompt('Enter type (internship/competition/volunteering/course/workshop/research):');
    if (!type) return;
    
    const interests = prompt('Enter interest tags (comma separated):');
    if (!interests) return;
    
    const gradeMin = prompt('Enter minimum grade (e.g. 10):');
    const gradeMax = prompt('Enter maximum grade (e.g. 12):');
    
    db.collection('activities').add({
        name: name,
        type: type,
        interest_tags: interests.split(',').map(t => t.trim()),
        grade_min: parseInt(gradeMin) || 10,
        grade_max: parseInt(gradeMax) || 12,
        cost: 'Free',
        duration: 'TBD',
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('✅ Activity added successfully!');
        loadActivities();
        loadDashboard();
    }).catch(error => alert('❌ Error: ' + error.message));
}

function editActivity(id) {
    const newName = prompt('Enter new activity name:');
    if (newName && newName.trim()) {
        db.collection('activities').doc(id).update({ 
            name: newName.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert('✅ Activity updated!');
            loadActivities();
        })
        .catch(error => alert('❌ Error: ' + error.message));
    }
}

// ============================================================
// SEARCH AND FILTER
// ============================================================
document.getElementById('search-students')?.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('#students-list tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

document.getElementById('filter-grade')?.addEventListener('change', function() {
    const filter = this.value;
    document.querySelectorAll('#students-list tr').forEach(row => {
        const gradeCell = row.querySelectorAll('td')[2];
        const grade = gradeCell ? gradeCell.textContent : '';
        row.style.display = !filter || grade.includes(filter) ? '' : 'none';
    });
});

console.log('✅ Admin dashboard initialized!');
