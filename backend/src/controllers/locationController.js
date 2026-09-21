/* ==========================================================================
   PULSERED - Andhra Pradesh Location & Government Hospital Controller
   ========================================================================== */

const { AP_DISTRICTS, AP_GOVT_HOSPITALS, getDistricts, getCitiesByDistrict, getGovtHospitals, getAllLocationsFlat } = require('../utils/apLocations');

async function getAPDistricts(req, res, next) {
    try {
        const districts = getDistricts();
        res.json({
            success: true,
            state: 'Andhra Pradesh',
            totalDistricts: districts.length,
            districts
        });
    } catch (err) {
        next(err);
    }
}

async function getCities(req, res, next) {
    try {
        const { district } = req.query;
        if (!district) {
            return res.json({ success: true, locations: getAllLocationsFlat() });
        }
        const cities = getCitiesByDistrict(district);
        res.json({
            success: true,
            state: 'Andhra Pradesh',
            district,
            cities
        });
    } catch (err) {
        next(err);
    }
}

async function getGovtHospitalsController(req, res, next) {
    try {
        const { district } = req.query;
        const hospitals = getGovtHospitals(district);
        res.json({
            success: true,
            state: 'Andhra Pradesh',
            district: district || 'All Districts',
            totalHospitals: hospitals.length,
            hospitals
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAPDistricts,
    getCities,
    getGovtHospitalsController
};
