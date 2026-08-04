/* ==========================================================================
   PULSERED - Donor Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/search', donorController.searchDonors);
router.get('/me', authenticateToken, donorController.getMyProfile);
router.put('/me', authenticateToken, donorController.updateMyProfile);
router.patch('/me/availability', authenticateToken, donorController.updateAvailability);

module.exports = router;
