/* ==========================================================================
   PULSERED - Donor Controller
   Endpoints: GET /api/donors/search, GET /api/donors/me, PUT /api/donors/me, PATCH /api/donors/me/availability
   ========================================================================== */

const donorService = require('../services/donorService');

async function searchDonors(req, res, next) {
    try {
        const result = await donorService.searchDonors(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getMyProfile(req, res, next) {
    try {
        const profile = await donorService.getDonorByUserId(req.user.id);
        res.json({ success: true, profile });
    } catch (err) {
        next(err);
    }
}

async function updateMyProfile(req, res, next) {
    try {
        const profile = await donorService.upsertDonorProfile(req.user.id, req.body);
        res.json({ success: true, message: 'Donor profile updated successfully.', profile });
    } catch (err) {
        next(err);
    }
}

async function updateAvailability(req, res, next) {
    try {
        const profile = await donorService.updateAvailability(req.user.id, req.body);
        res.json({ success: true, message: 'Availability status updated.', profile });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    searchDonors,
    getMyProfile,
    updateMyProfile,
    updateAvailability
};
