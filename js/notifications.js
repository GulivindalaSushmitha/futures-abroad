// ============================================================
// js/notifications.js - Notification System
// ============================================================

import { 
    db, COLLECTIONS, 
    doc, getDoc, getDocs, collection, 
    query, where, addDoc, serverTimestamp,
    updateDoc, onSnapshot
} from './firebase-config.js';

// ============================================================
// NOTIFICATION TYPES
// ============================================================
export const NOTIFICATION_TYPES = {
    DEADLINE_REMINDER: 'deadline_reminder',
    NEW_ACTIVITY: 'new_activity',
    REGISTRATION_CONFIRMATION: 'registration_confirmation',
    ACTIVITY_COMPLETED: 'activity_completed',
    COUNSELOR_MESSAGE: 'counselor_message',
    GRADE_MILESTONE: 'grade_milestone'
};

// ============================================================
// SEND NOTIFICATION
// ============================================================
export async function sendNotification(userId, type, title, message, data = {}) {
    try {
        const notification = {
            userId: userId,
            type: type,
            title: title,
            message: message,
            data: data,
            read: false,
            sentAt: serverTimestamp(),
            delivered: false
        };

        const notifRef = collection(db, COLLECTIONS.notifications);
        const docRef = await addDoc(notifRef, notification);
        
        // Also send email if user has email
        await sendEmailNotification(userId, title, message);
        
        console.log(`✅ Notification sent to ${userId}: ${title}`);
        return docRef.id;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
}

// ============================================================
// SEND EMAIL NOTIFICATION (using EmailJS or similar)
// ============================================================
async function sendEmailNotification(userId, title, message) {
    try {
        // Get user email
        const userRef = doc(db, COLLECTIONS.users, userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (!userData || !userData.email) {
            console.log('⚠️ No email found for user:', userId);
            return;
        }

        // Here you would integrate with EmailJS, SendGrid, etc.
        // For now, we store in localStorage for demo
        const emailLog = JSON.parse(localStorage.getItem('emailNotifications') || '[]');
        emailLog.push({
            to: userData.email,
            subject: title,
            body: message,
            sentAt: new Date().toISOString()
        });
        localStorage.setItem('emailNotifications', JSON.stringify(emailLog));
        
        console.log(`📧 Email notification queued for ${userData.email}: ${title}`);
        
        // Actually send email using EmailJS (you need to set this up)
        // await sendEmailJS(userData.email, title, message);
        
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// ============================================================
// SCHEDULE DEADLINE REMINDERS
// ============================================================
export async function scheduleDeadlineReminders(activityId, userId, deadlineDate) {
    const reminders = [
        { days: 14, label: '2 weeks' },
        { days: 7, label: '1 week' },
        { days: 3, label: '3 days' },
        { days: 1, label: '1 day' }
    ];

    const deadline = new Date(deadlineDate);
    
    reminders.forEach(reminder => {
        const reminderDate = new Date(deadline);
        reminderDate.setDate(reminderDate.getDate() - reminder.days);
        
        // Store in localStorage for demo
        const reminderKey = `reminder_${activityId}_${userId}_${reminder.days}`;
        localStorage.setItem(reminderKey, JSON.stringify({
            activityId,
            userId,
            days: reminder.days,
            label: reminder.label,
            reminderDate: reminderDate.toISOString(),
            deadline: deadline.toISOString(),
            sent: false
        }));
        
        console.log(`⏰ Scheduled ${reminder.label} reminder for ${reminderDate.toISOString()}`);
    });
}

// ============================================================
// CHECK AND SEND PENDING REMINDERS
// ============================================================
export function checkPendingReminders() {
    const now = new Date();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
        if (key.startsWith('reminder_')) {
            try {
                const reminder = JSON.parse(localStorage.getItem(key));
                if (!reminder.sent) {
                    const reminderDate = new Date(reminder.reminderDate);
                    if (now >= reminderDate) {
                        // Send notification
                        sendNotification(
                            reminder.userId,
                            NOTIFICATION_TYPES.DEADLINE_REMINDER,
                            `⏰ ${reminder.label} Deadline Reminder`,
                            `Your activity deadline is in ${reminder.label}. Don't forget to complete your registration!`,
                            { activityId: reminder.activityId, deadline: reminder.deadline }
                        );
                        
                        // Mark as sent
                        reminder.sent = true;
                        localStorage.setItem(key, JSON.stringify(reminder));
                        console.log(`📨 Sent ${reminder.label} reminder for activity ${reminder.activityId}`);
                    }
                }
            } catch (e) {
                console.error('Error checking reminder:', e);
            }
        }
    });
}

// ============================================================
// GET USER NOTIFICATIONS
// ============================================================
export async function getUserNotifications(userId) {
    try {
        const notifRef = collection(db, COLLECTIONS.notifications);
        const q = query(notifRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        
        return notifications.sort((a, b) => {
            return new Date(b.sentAt?.toDate()) - new Date(a.sentAt?.toDate());
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================
export async function markNotificationAsRead(notificationId) {
    try {
        const notifRef = doc(db, COLLECTIONS.notifications, notificationId);
        await updateDoc(notifRef, {
            read: true,
            readAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================
export async function markAllNotificationsAsRead(userId) {
    try {
        const notifRef = collection(db, COLLECTIONS.notifications);
        const q = query(notifRef, 
            where("userId", "==", userId),
            where("read", "==", false)
        );
        const snapshot = await getDocs(q);
        
        const updates = [];
        snapshot.forEach(doc => {
            updates.push(updateDoc(doc.ref, {
                read: true,
                readAt: serverTimestamp()
            }));
        });
        
        await Promise.all(updates);
        return updates.length;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return 0;
    }
}

// ============================================================
// SUBSCRIBE TO NOTIFICATIONS (Real-time)
// ============================================================
export function subscribeToNotifications(userId, callback) {
    const notifRef = collection(db, COLLECTIONS.notifications);
    const q = query(notifRef, 
        where("userId", "==", userId),
        where("read", "==", false)
    );
    
    return onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        callback(notifications);
    });
}

// ============================================================
// REQUEST PERMISSION FOR WEB NOTIFICATIONS
// ============================================================
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// ============================================================
// SEND WEB PUSH NOTIFICATION
// ============================================================
export function sendWebNotification(title, body, icon = '🚀') {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    try {
        const notification = new Notification(`${icon} ${title}`, {
            body: body,
            icon: 'favicon.ico'
        });

        notification.onclick = function() {
            window.focus();
            this.close();
        };

        return notification;
    } catch (error) {
        console.error('Error sending web notification:', error);
    }
}

// ============================================================
// CHECK AND SEND ALL PENDING NOTIFICATIONS
// ============================================================
export function initNotificationSystem() {
    // Check reminders every 5 minutes
    setInterval(checkPendingReminders, 5 * 60 * 1000);
    
    // Check on page load
    setTimeout(checkPendingReminders, 5000);
    
    console.log('📬 Notification system initialized');
}

// ============================================================
// SEND REGISTRATION CONFIRMATION
// ============================================================
export async function sendRegistrationConfirmation(userId, activityName, activityId) {
    await sendNotification(
        userId,
        NOTIFICATION_TYPES.REGISTRATION_CONFIRMATION,
        `✅ Registered for ${activityName}`,
        `You have successfully registered for "${activityName}". Check your dashboard for updates.`,
        { activityId: activityId }
    );
    
    // Send web notification
    sendWebNotification(
        'Registration Confirmed',
        `You're registered for ${activityName}!`,
        '✅'
    );
}

// ============================================================
// SEND ACTIVITY COMPLETED NOTIFICATION
// ============================================================
export async function sendActivityCompletedNotification(userId, activityName, activityId) {
    await sendNotification(
        userId,
        NOTIFICATION_TYPES.ACTIVITY_COMPLETED,
        `🎉 Completed: ${activityName}`,
        `Great job completing "${activityName}"! Your portfolio has been updated.`,
        { activityId: activityId }
    );
    
    sendWebNotification(
        'Activity Completed! 🎉',
        `You completed "${activityName}"! Check your portfolio.`,
        '✅'
    );
}

// ============================================================
// SEND GRADE MILESTONE NOTIFICATION
// ============================================================
export async function sendGradeMilestoneNotification(userId, grade) {
    const message = grade >= 11 
        ? `You're in Grade ${grade}! It's time to start building your university shortlist.`
        : `You're in Grade ${grade}! Keep building your profile with activities and reflections.`;
    
    await sendNotification(
        userId,
        NOTIFICATION_TYPES.GRADE_MILESTONE,
        `🎓 Grade ${grade} Milestone`,
        message,
        { grade: grade }
    );
    
    sendWebNotification(
        'Grade Milestone 🎓',
        message,
        '📚'
    );
}

console.log('✅ Notifications module loaded!');
