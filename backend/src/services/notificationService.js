/* ==========================================================================
   PULSERED - Internal Notification Service
   ========================================================================== */

const inMemoryNotifications = [
    {
        id: 'notif-1',
        userId: 'usr-admin-01',
        title: 'Emergency Donor Dispatch',
        message: 'Donor Kalyan Varma (O-) is driving to Apollo Hospital Trauma Center.',
        type: 'EMERGENCY_DISPATCH',
        isRead: false,
        createdAt: new Date(Date.now() - 900000)
    },
    {
        id: 'notif-2',
        userId: 'usr-admin-01',
        title: 'New Google Form Donor Sync',
        message: 'New O- donor registered via Google Forms in Visakhapatnam District.',
        type: 'GOOGLE_FORM_SYNC',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000)
    }
];

class NotificationService {
    createNotification({ userId, title, message, type = 'INFO' }) {
        const notif = {
            id: `notif-${Date.now()}`,
            userId,
            title,
            message,
            type,
            isRead: false,
            createdAt: new Date()
        };
        inMemoryNotifications.unshift(notif);
        return notif;
    }

    broadcastEmergencyAlert({ title, message, district, compatibleGroups }) {
        const notif = {
            id: `notif-broadcast-${Date.now()}`,
            userId: 'ALL',
            title,
            message,
            type: 'EMERGENCY_ALERT',
            district,
            compatibleGroups,
            isRead: false,
            createdAt: new Date()
        };
        inMemoryNotifications.unshift(notif);
        return notif;
    }

    getUserNotifications(userId) {
        return inMemoryNotifications.filter(n => n.userId === userId || n.userId === 'ALL');
    }

    markAsRead(notificationId) {
        const notif = inMemoryNotifications.find(n => n.id === notificationId);
        if (notif) notif.isRead = true;
        return notif;
    }
}

module.exports = new NotificationService();
