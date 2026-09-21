/* ==========================================================================
   PULSERED - Blood Request Routes with RBAC Security
   ========================================================================== */

const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken, optionalAuth, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', requestController.getRequests);
router.get('/:id', requestController.getRequestById);

// Registered and guest users can submit blood requests
router.post('/', optionalAuth, requestController.createRequest);

// Only ADMIN users can update/approve request statuses
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), requestController.updateRequestStatus);

module.exports = router;
