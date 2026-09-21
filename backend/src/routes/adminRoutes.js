/* ==========================================================================
   PULSERED - Admin Protected Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes require ADMIN role authorization
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);

module.exports = router;
