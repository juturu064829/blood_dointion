/* ==========================================================================
   PULSERED - Blood Request Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', requestController.createRequest);
router.get('/', requestController.getRequests);
router.get('/:id', requestController.getRequestById);
router.put('/:id', requestController.updateRequestStatus);

module.exports = router;
