/* ==========================================================================
   PULSERED - Andhra Pradesh Location Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/ap-districts', locationController.getAPDistricts);
router.get('/cities', locationController.getCities);

module.exports = router;
