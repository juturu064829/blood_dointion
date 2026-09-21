/* ==========================================================================
   PULSERED - User Isolation & Private Profile Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/me', authenticateToken, authController.getMe);
router.put('/me', authenticateToken, authController.updateMe);

module.exports = router;
