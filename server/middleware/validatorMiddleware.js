/* ==========================================================================
   PULSERED - Input Validation & Sanitization Middleware
   Features: XSS Sanitization, Blood Group Enforcement, Request Validation
   ========================================================================== */

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_REGIONS = [
    'Visakhapatnam', 'Krishna', 'Guntur', 'Tirupati', 'Kurnool', 'Nandyal', 'Nellore', 'Kakinada', 
    'East Godavari', 'Konaseema', 'YSR Kadapa', 'Annamayya', 'Chittoor', 'Sri Sathya Sai', 'Anantapur', 
    'Prakasam', 'Bapatla', 'Palnadu', 'Eluru', 'West Godavari', 'Vizianagaram', 'Srikakulam', 
    'Parvathipuram', 'ASR District', 'NTR District', 'Anakapalli', 'Central Metro', 'North District', 'South Hub'
];
const VALID_READY_STATUS = ['Immediate', 'Today', '24 Hours', 'Unavailable'];

/**
 * Sanitize string input to prevent XSS script injection
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Middleware to sanitize all body parameters recursively
 */
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };
        sanitizeObject(req.body);
    }
    next();
}

/**
 * Validator for Donor Registration & Updates
 */
function validateDonorPayload(req, res, next) {
    const { name, bloodType, phone, email } = req.body;

    if (req.method === 'POST') {
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: 'Donor name must be at least 2 characters' });
        }
        if (!bloodType || !VALID_BLOOD_GROUPS.includes(bloodType.toUpperCase())) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` });
        }
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: 'Valid email address is required' });
        }
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
        if (bloodType && !VALID_BLOOD_GROUPS.includes(bloodType.toUpperCase())) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` });
        }
        if (email && !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid email format' });
        }
    }

    next();
}

/**
 * Validator for Emergency Blood Request
 */
function validateEmergencyRequest(req, res, next) {
    const { requesterName, hospitalName, bloodType, unitsRequired, contactPhone } = req.body;

    if (!requesterName || requesterName.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Requester name is required' });
    }
    if (!hospitalName || hospitalName.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Hospital name is required' });
    }
    if (!bloodType || !VALID_BLOOD_GROUPS.includes(bloodType.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` });
    }
    if (!unitsRequired || isNaN(unitsRequired) || parseInt(unitsRequired, 10) < 1) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Units required must be a positive number' });
    }
    if (!contactPhone || contactPhone.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Contact phone number is required' });
    }

    next();
}

module.exports = {
    sanitizeString,
    sanitizeBody,
    validateDonorPayload,
    validateEmergencyRequest,
    VALID_BLOOD_GROUPS,
    VALID_REGIONS,
    VALID_READY_STATUS
};
