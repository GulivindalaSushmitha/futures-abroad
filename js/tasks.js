// ============================================================
// js/tasks.js - Counselor Tasks (Phase 6)
// ============================================================

import { 
    db, auth, COLLECTIONS,
    collection, doc, getDocs, query, where, addDoc,
    updateDoc, deleteDoc, onAuthStateChanged, serverTimestamp 
} from './firebase-config.js';

// ============================================================
// Load Tasks from Firestore
// ============================================================
async function loadTasks() {
    const user = auth.currentUser;
    if (!user) {
        console.warn('No user logged in');
        return;
    }
    
    try {
        const tasksRef = collection(db, COLLECTIONS.counselorTasks);
        const q = query(tasksRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        const container = document.getElementById('taskList');
        if (!container) {
            console.warn('Task container not found');
            return;
        }
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align:center;padding:2rem;color:#888;">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">📋</div>
                    <p>No tasks assigned yet.</p>
                    <p style="font-size:0.85rem;">Your counselor will assign tasks here.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        let completedCount = 0;
        let pendingCount = 0;
        
        snapshot.forEach((doc) => {
            const task = doc.data();
            const id = doc.id;
            const isCompleted = task.completed || false;
            
            if (isCompleted) completedCount++;
            else pendingCount++;
            
            const priorityColor = task.priority === 'high' ? '#ef4444' : 
                                  task.priority === 'medium' ? '#f59e0b' : '#6C3CE1';
            
            html += `
                <div style="
                    background: ${isCompleted ? '#f0fdf4' : '#f8f9fa'}; 
                    padding: 1rem 1.25rem; 
                    border-radius: 12px; 
                    margin-bottom: 0.75rem; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    border-left: 4px solid ${isCompleted ? '#22c55e' : priorityColor};
                    transition: all 0.3s;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                "
                onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'"
                onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'"
                >
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span style="font-weight:600;font-size:1rem;color:#2D1B4E;">${task.title || 'Task'}</span>
                            ${task.priority ? `<span style="font-size:0.65rem;background:${priorityColor};color:white;padding:2px 10px;border-radius:12px;font-weight:600;text-transform:uppercase;">${task.priority}</span>` : ''}
                            ${isCompleted ? '<span style="font-size:0.7rem;color:#22c55e;font-weight:600;">✅ Done</span>' : '<span style="font-size:0.7rem;color:#f59e0b;font-weight:600;">⏳ Pending</span>'}
                        </div>
                        ${task.description ? `<div style="font-size:0.9rem;color:#666;margin-top:3px;">${task.description}</div>` : ''}
                        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:4px;font-size:0.8rem;color:#888;">
                            ${task.assignedDate ? `<span>📅 Assigned: ${formatDate(task.assignedDate)}</span>` : ''}
                            ${task.deadline ? `<span>⏰ Due: ${formatDate(task.deadline)}</span>` : ''}
                            ${task.category ? `<span>📂 ${task.category}</span>` : ''}
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;margin-left:12px;">
                        ${!isCompleted ? `
                            <button onclick="window.completeTask('${id}')" style="
                                background: #22c55e; 
                                color: white; 
                                border: none; 
                                padding: 0.4rem 1rem; 
                                border-radius: 20px; 
                                cursor: pointer; 
                                font-weight: 600;
                                font-size: 0.8rem;
                                transition: all 0.3s;
                                font-family: 'Quicksand', sans-serif;
                            "
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'"
                            >
                                ✅ Mark Done
                            </button>
                        ` : `
                            <span style="color:#22c55e;font-size:0.9rem;">✓</span>
                        `}
                    </div>
                </div>
            `;
        });
        
        // Add summary
        const summaryHtml = `
            <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:1rem;padding:0.75rem 1rem;background:#f8f9fa;border-radius:8px;">
                <span>📋 Total: <strong>${completedCount + pendingCount}</strong></span>
                <span>✅ Completed: <strong style="color:#22c55e;">${completedCount}</strong></span>
                <span>⏳ Pending: <strong style="color:#f59e0b;">${pendingCount}</strong></span>
            </div>
        `;
        
        container.innerHTML = summaryHtml + html;
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        const container = document.getElementById('taskList');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center;padding:1rem;color:#ef4444;">
                    ⚠️ Error loading tasks. Please refresh.
                </div>
            `;
        }
    }
}

// ============================================================
// Format Date Helper
// ============================================================
function formatDate(dateValue) {
    if (!dateValue) return 'N/A';
    try {
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch {
        return String(dateValue);
    }
}

// ============================================================
// Complete Task
// ============================================================
async function completeTask(taskId) {
    const user = auth.currentUser;
    if (!user) {
        showToast('Please log in first.', 'error');
        return;
    }
    
    try {
        await updateDoc(doc(db, COLLECTIONS.counselorTasks, taskId), {
            completed: true,
            completedAt: serverTimestamp()
        });
        
        showToast('✅ Task completed! Great job!', 'success');
        await loadTasks();
        
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Error completing task. Please try again.', 'error');
    }
}

// ============================================================
// Toast Notification Helper
// ============================================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        info: '#6C3CE1'
    };
    
    toast.style.cssText = `
        position: fixed; 
        bottom: 2rem; 
        right: 2rem;
        background: ${colors[type] || colors.info};
        color: white; 
        padding: 1rem 1.5rem; 
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 99999; 
        max-width: 400px;
        animation: slideUp 0.3s ease;
        font-weight: 500;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.95rem;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================================
// Initialize - Load tasks on page load
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadTasks();
        }
    });
});

// ============================================================
// Make completeTask available globally for inline onclick
// ============================================================
window.completeTask = completeTask;

// ============================================================
// Exports
// ============================================================
export { loadTasks, completeTask, formatDate };
