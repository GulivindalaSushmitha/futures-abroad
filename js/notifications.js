// notifications.js - Notification System

import { auth, db } from './firebase-config.js';

// Send notification to user
export async function sendNotification(userId, title, message, type = 'info') {
    try {
        const notification = {
            userId: userId,
            title: title,
            message: message,
            type: type,
            read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        };

        await db.collection('notifications').add(notification);
        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}

// Get unread notifications for user
export async function getUnreadNotifications(userId) {
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .orderBy('timestamp', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true
        });
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

// Send reminders for deadlines
export async function checkDeadlineReminders() {
    try {
        const now = new Date();
        
        // Get all registered activities with upcoming deadlines
        const snapshot = await db.collection('registeredActivities')
            .where('deadline', '>=', now.toISOString())
            .get();

        snapshot.forEach(async (doc) => {
            const data = doc.data();
            const deadline = new Date(data.deadline);
            const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

            // Send reminders at specific intervals
            const reminders = [14, 7, 3, 1];
            if (reminders.includes(daysUntil)) {
                await sendNotification(
                    data.userId,
                    'Activity Deadline Approaching',
                    `Your activity "${data.activityName}" is ${daysUntil} days away!`,
                    'deadline'
                );
            }
        });

    } catch (error) {
        console.error('Error checking deadline reminders:', error);
    }
}

// Check for grade milestones
export async function checkGradeMilestones() {
    try {
        const usersSnapshot = await db.collection('users').get();

        usersSnapshot.forEach(async (doc) => {
            const userData = doc.data();
            const userId = doc.id;
            
            // Check if student is starting Grade 11
            if (userData.grade === '11' && !userData.gradeMilestoneNotified) {
                await sendNotification(
                    userId,
                    '🎓 New Grade Level: Start Your University Journey!',
                    'You\'re starting Grade 11. Let\'s get serious about universities. Check your university shortlist!',
                    'milestone'
                );

                // Send to parents as well
                if (userData.parentEmail) {
                    // Send email notification via email service
                }

                // Update milestone status
                await db.collection('users').doc(userId).update({
                    gradeMilestoneNotified: true
                });
            }
        });

    } catch (error) {
        console.error('Error checking grade milestones:', error);
    }
}
