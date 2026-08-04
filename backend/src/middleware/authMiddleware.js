/* ==========================================================================
   PULSERED - Authentication & Role Verification Middleware
   ========================================================================== */

const { verifyJwt } = require('../services/authService');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies?.accessToken || req.cookies?.jwt;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token required. Please log in.'
        });
    }

    try {
        const decoded = verifyJwt(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token. Access denied.'
        });
    }
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access forbidden: Role '${req.user.role}' is not authorized.`
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles
};
