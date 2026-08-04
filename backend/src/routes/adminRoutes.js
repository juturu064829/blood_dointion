/* ==========================================================================
   PULSERED - Admin Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/stats', adminController.getDashboardStats);
router.get('/users', authenticateToken, authorizeRoles('ADMIN', 'super_admin'), adminController.getUsers);

module.exports = router;
