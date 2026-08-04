/* ==========================================================================
   PULSERED - Blood Request Controller
   Endpoints: POST /api/blood-requests, GET /api/blood-requests, GET /api/blood-requests/:id, PUT /api/blood-requests/:id
   ========================================================================== */

const requestService = require('../services/requestService');

async function createRequest(req, res, next) {
    try {
        const userId = req.user ? req.user.id : 'usr-anonymous';
        const newReq = await requestService.createBloodRequest(userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Blood request submitted and emergency broadcast initiated.',
            data: newReq
        });
    } catch (err) {
        next(err);
    }
}

async function getRequests(req, res, next) {
    try {
        const result = await requestService.getBloodRequests(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getRequestById(req, res, next) {
    try {
        const reqItem = await requestService.getBloodRequestById(req.params.id);
        res.json({ success: true, data: reqItem });
    } catch (err) {
        next(err);
    }
}

async function updateRequestStatus(req, res, next) {
    try {
        const { status } = req.body;
        const updated = await requestService.updateRequestStatus(req.params.id, status, req.user ? req.user.id : null);
        res.json({ success: true, message: 'Request status updated.', data: updated });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus
};
