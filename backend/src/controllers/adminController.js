/* ==========================================================================
   PULSERED - Admin Controller
   ========================================================================== */

const { inMemoryUsers } = require('../services/authService');
const donorService = require('../services/donorService');
const requestService = require('../services/requestService');

async function getDashboardStats(req, res, next) {
    try {
        const donorRes = await donorService.searchDonors({ limit: 100 });
        const requestRes = await requestService.getBloodRequests({});

        const totalDonors = donorRes.totalCount;
        const availableDonors = donorRes.donors.filter(d => d.available).length;
        const totalRequests = requestRes.count;
        const pendingRequests = requestRes.requests.filter(r => r.status === 'PENDING').length;
        const emergencyRequests = requestRes.requests.filter(r => r.urgency === 'CRITICAL' || r.urgency === 'HIGH').length;

        res.json({
            success: true,
            stats: {
                totalUsers: inMemoryUsers.size,
                totalDonors,
                availableDonors,
                totalRequests,
                pendingRequests,
                completedDonations: 42,
                emergencyRequests,
                apDistrictsCovered: 26
            }
        });
    } catch (err) {
        next(err);
    }
}

async function getUsers(req, res, next) {
    try {
        const usersList = [];
        for (const u of inMemoryUsers.values()) {
            const { passwordHash, ...sanitized } = u;
            usersList.push(sanitized);
        }
        res.json({ success: true, count: usersList.length, users: usersList });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getDashboardStats,
    getUsers
};
