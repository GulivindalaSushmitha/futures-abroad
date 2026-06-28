// ============================================================
// js/admin.js - Admin Dashboard Logic
// ============================================================

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('admins').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    loadDashboard();
                } else {
                    auth.signOut();
                    window.location.href = 'admin-login.html';
                }
            });
        } else {
            window.location.href = 'admin-login.html';
        }
    });

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

async function loadDashboard() {
    try {
        const studentsSnapshot = await db.collection('students').get();
        document.getElementById('total-students').textContent = studentsSnapshot.size;

        const quizSnapshot = await db.collection('students').where('profileCompleted', '==', true).get();
        document.getElementById('completed-quiz').textContent = quizSnapshot.size;

        const recentSnapshot = await db.collection('students').orderBy('createdAt', 'desc').limit(10).get();
        const tbody = document.getElementById('recent-students');
        tbody.innerHTML = '';
        recentSnapshot.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `<tr><td>${data.name || 'N/A'}</td><td>Grade ${data.grade || 'N/A'}</td><td>${(data.interests || []).join(', ') || 'Not set'}</td><td>${data.profileCompleted ? '✅ Complete' : '⏳ Pending'}</td><td>${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td></tr>`;
        });

        loadStudents();
        loadActivities();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStudents() {
    try {
        const snapshot = await db.collection('students').get();
        const tbody = document.getElementById('students-list');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `<tr><td>${data.name || 'N/A'}</td><td>${data.email || 'N/A'}</td><td>Grade ${data.grade || 'N/A'}</td><td>${(data.interests || []).join(', ') || 'Not set'}</td><td>Phase ${data.onboardingPhase || 1}</td><td><button onclick="viewStudent('${doc.id}')" class="btn-sm">View</button> <button onclick="deleteStudent('${doc.id}')" class="btn-sm btn-danger">Delete</button></td></tr>`;
        });
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadActivities() {
    try {
        const snapshot = await db.collection('activities').get();
        const tbody = document.getElementById('activities-list');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `<tr><td>${data.name || 'N/A'}</td><td>${data.type || 'N/A'}</td><td>${(data.interest_tags || []).join(', ') || 'N/A'}</td><td>${data.grade_min || 'N/A'} - ${data.grade_max || 'N/A'}</td><td>${data.active !== false ? '✅ Active' : '⏸️ Inactive'}</td><td><button onclick="editActivity('${doc.id}')" class="btn-sm">Edit</button> <button onclick="deleteActivity('${doc.id}')" class="btn-sm btn-danger">Delete</button></td></tr>`;
        });
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function viewStudent(id) {
    window.location.href = `student-detail.html?id=${id}`;
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await db.collection('students').doc(id).delete();
            loadDashboard();
        } catch (error) {
            alert('Failed to delete student: ' + error.message);
        }
    }
}

async function deleteActivity(id) {
    if (confirm('Are you sure you want to delete this activity?')) {
        try {
            await db.collection('activities').doc(id).delete();
            loadActivities();
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
    const gradeMin = prompt('Enter minimum grade:');
    const gradeMax = prompt('Enter maximum grade:');
    
    db.collection('activities').add({
        name, type,
        interest_tags: interests.split(',').map(t => t.trim()),
        grade_min: parseInt(gradeMin) || 10,
        grade_max: parseInt(gradeMax) || 12,
        cost: 'Free', duration: 'TBD', active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Activity added!');
        loadActivities();
    }).catch(error => alert('Error: ' + error.message));
}

function editActivity(id) {
    const newName = prompt('Enter new name:');
    if (newName) {
        db.collection('activities').doc(id).update({ name: newName })
            .then(() => loadActivities());
    }
}

function logout() {
    auth.signOut();
    window.location.href = 'admin-login.html';
}

// Search and filter
document.getElementById('search-students')?.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('#students-list tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    });
});

document.getElementById('filter-grade')?.addEventListener('change', function() {
    const filter = this.value;
    document.querySelectorAll('#students-list tr').forEach(row => {
        const grade = row.cells[2]?.textContent || '';
        row.style.display = !filter || grade.includes(filter) ? '' : 'none';
    });
});
