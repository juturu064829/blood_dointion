/* ==========================================================================
   PULSERED - Andhra Pradesh Location Controller
   ========================================================================== */

const { AP_DISTRICTS, getDistricts, getCitiesByDistrict, getAllLocationsFlat } = require('../utils/apLocations');

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

module.exports = {
    getAPDistricts,
    getCities
};
