/* ==========================================================================
   PULSERED - Andhra Pradesh Location & Government Hospital Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/ap-districts', locationController.getAPDistricts);
router.get('/cities', locationController.getCities);
router.get('/ap-govt-hospitals', locationController.getGovtHospitalsController);

module.exports = router;
