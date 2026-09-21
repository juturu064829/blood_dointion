/* ==========================================================================
   PULSERED - Security Payload Validator & Input Sanitizer Middleware
   ========================================================================== */

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-()]{7,20}$/;

function validateRegistration(req, res, next) {
    let { email, password, name, phone, bloodGroup } = req.body || {};

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters long.' });
    }
    if (phone && !PHONE_REGEX.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }
    if (bloodGroup && !VALID_BLOOD_GROUPS.includes(bloodGroup.toUpperCase())) {
        return res.status(400).json({ success: false, message: `Invalid blood group. Allowed: ${VALID_BLOOD_GROUPS.join(', ')}` });
    }

    // Sanitize inputs
    req.body.name = name.trim().replace(/[<>]/g, '');
    req.body.email = email.trim().toLowerCase();

    next();
}

function validateLogin(req, res, next) {
    const { email, phone, loginId, password } = req.body || {};
    const identifier = loginId || email || phone;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        return res.status(400).json({ success: false, message: 'Email or Mobile number is required.' });
    }
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    next();
}

module.exports = {
    validateRegistration,
    validateLogin,
    VALID_BLOOD_GROUPS
};
