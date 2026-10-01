/* ==========================================================================
   PULSERED - Authentication & Role Verification Middleware
   ========================================================================== */

const authService = require('../services/authService');
const { verifyJwt } = authService;
const { logSecurityEvent } = require('../utils/securityLogger');

async function getCurrentUser(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        logSecurityEvent('UNAUTHENTICATED_ACCESS_ATTEMPT', req, 'Missing Authorization header');
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication token required. Please log in.'
        });
    }

    if (!authHeader.startsWith('Bearer ')) {
        logSecurityEvent('MALFORMED_TOKEN_ATTEMPT', req, 'Authorization header must use Bearer scheme');
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Malformed authorization header. Format must be Authorization: Bearer <access_token>.'
        });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        logSecurityEvent('MALFORMED_TOKEN_ATTEMPT', req, 'Empty Bearer token in Authorization header');
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication token required. Bearer token is empty.'
        });
    }

    try {
        const decoded = verifyJwt(token);
        const userId = decoded.sub || decoded.user_id || decoded.id;

        // Retrieve authenticated user from database using validated identity
        let dbUser = null;
        try {
            dbUser = await authService.getUserById(userId);
        } catch (e) {
            dbUser = null;
        }

        if (!dbUser || dbUser.isActive === false || dbUser.disabled === true) {
            logSecurityEvent('INACTIVE_USER_ATTEMPT', req, `User ID '${userId}' no longer exists or is inactive`);
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User account no longer exists or is inactive.'
            });
        }

        req.user = decoded;
        req.currentUser = dbUser;
        next();
    } catch (err) {
        logSecurityEvent('INVALID_TOKEN_ATTEMPT', req, err.message);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired token. Access denied.'
        });
    }
}

function authenticateToken(req, res, next) {
    return getCurrentUser(req, res, next);
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
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
    } else {
        req.user = null;
    }
    next();
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            logSecurityEvent('UNAUTHENTICATED_ROLE_CHECK', req, 'No user context found');
            return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            logSecurityEvent('UNAUTHORIZED_ROLE_ACCESS', req, `User ID '${req.user.id}' with role '${req.user.role}' attempted restricted action requiring ${allowedRoles.join('/')}`);
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: `Access forbidden: Role '${req.user.role}' is not authorized.`
            });
        }
        next();
    };
}

module.exports = {
    getCurrentUser,
    get_current_user: getCurrentUser,
    authenticateToken,
    optionalAuth,
    authorizeRoles
};
