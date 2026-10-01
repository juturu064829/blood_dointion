/* ==========================================================================
   PULSERED - Authentication Routes with Input Validation
   ========================================================================== */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin } = require('../middleware/validatorMiddleware');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authenticateToken, authController.getMe);
router.put('/me', authenticateToken, authController.updateMe);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
