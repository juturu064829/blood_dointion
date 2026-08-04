/* ==========================================================================
   PULSERED - Authentication & Authorization Middleware
   Features: JWT Bearer Verification, Explicit Algorithm Check, RBAC Rules
   ========================================================================== */

const authService = require('../services/authService');

/**
 * Middleware to authenticate requests using JWT Bearer tokens
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: 'Access token missing or invalid format in Authorization header'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = authService.verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: err.message || 'Invalid or expired access token'
        });
    }
}

/**
 * Role-Based Access Control (RBAC) middleware
 * @param {...string} allowedRoles - List of authorized roles
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
        }

        const userRole = req.user.role || 'donor';
        
        if (!allowedRoles.includes(userRole) && !allowedRoles.includes('*')) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
}

module.exports = {
    authenticateJWT,
    requireRole
};
