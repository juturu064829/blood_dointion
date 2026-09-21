/* ==========================================================================
   PULSERED - Authentication & Role Verification Middleware
   ========================================================================== */

const { verifyJwt } = require('../services/authService');
const { logSecurityEvent } = require('../utils/securityLogger');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies?.accessToken || req.cookies?.jwt;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        logSecurityEvent('UNAUTHENTICATED_ACCESS_ATTEMPT', req, 'Missing Authorization token');
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
        logSecurityEvent('INVALID_TOKEN_ATTEMPT', req, err.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token. Access denied.'
        });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies?.accessToken || req.cookies?.jwt;

    const token = tokenFromHeader || tokenFromCookie;

    if (token) {
        try {
            const decoded = verifyJwt(token);
            req.user = decoded;
        } catch (err) {
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            logSecurityEvent('UNAUTHENTICATED_ROLE_CHECK', req, 'No user context found');
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            logSecurityEvent('UNAUTHORIZED_ROLE_ACCESS', req, `User ID '${req.user.id}' with role '${req.user.role}' attempted restricted action requiring ${allowedRoles.join('/')}`);
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
    optionalAuth,
    authorizeRoles
};
