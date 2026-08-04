/* ==========================================================================
   PULSERED - Notification Controller
   ========================================================================== */

const notificationService = require('../services/notificationService');

async function getNotifications(req, res, next) {
    try {
        const userId = req.user ? req.user.id : 'usr-admin-01';
        const notifications = notificationService.getUserNotifications(userId);
        res.json({ success: true, count: notifications.length, notifications });
    } catch (err) {
        next(err);
    }
}

async function markRead(req, res, next) {
    try {
        const notif = notificationService.markAsRead(req.params.id);
        res.json({ success: true, notification: notif });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getNotifications,
    markRead
};
