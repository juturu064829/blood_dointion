/* ==========================================================================
   PULSERED - Production Express Backend API & Database Server
   Includes: Hardened Security, Rate Limiting, RBAC Auth, Database Persistence,
   Input Sanitization, ABO Compatibility Engine & Audit Trail
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authService = require('./services/authService');
const Database = require('./db/index');
const { authenticateJWT, requireRole } = require('./middleware/authMiddleware');
const { 
    sanitizeBody, 
    validateDonorPayload, 
    validateEmergencyRequest,
    VALID_BLOOD_GROUPS 
} = require('./middleware/validatorMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

// Disable x-powered-by header for security
app.disable('x-powered-by');

/* ==========================================================================
   1. HARDENED SECURITY & MIDDLEWARE
   ========================================================================== */

// 1.1 Helmet Security Headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for local dev dashboard asset loading
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' }
}));

// 1.2 Strict CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('CORS policy security violation: Origin not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 1.3 Request Body Size Limits (Prevent DoS Attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 1.4 Input Sanitization
app.use(sanitizeBody);

// 1.5 Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Auth Rate Limit', message: 'Too many authentication attempts. Please wait 15 minutes.' }
});

app.use('/api/', globalLimiter);
app.use('/api/v1/auth', authLimiter);

/* ==========================================================================
   2. SYSTEM HEALTH CHECK
   ========================================================================== */
app.get(['/', '/health', '/api/v1/health'], (req, res) => {
    res.json({
        success: true,
        status: 'online',
        service: 'PulseRed Blood Donation Core API & Persistent Database Server',
        timestamp: new Date().toISOString(),
        version: '1.2.0',
        security: {
            helmetHeaders: 'active',
            rateLimiting: 'active',
            jwtAlgorithm: 'HS256',
            corsOriginPolicy: 'restricted'
        },
        endpoints: [
            'GET  /api/v1/health',
            'GET  /api/v1/donors',
            'POST /api/v1/donors',
            'GET  /api/v1/inventory',
            'GET  /api/v1/requests',
            'POST /api/v1/requests',
            'POST /api/v1/compatibility/check',
            'GET  /api/v1/ledger',
            'GET  /api/v1/auth/google',
            'POST /api/v1/auth/google/callback',
            'POST /api/v1/auth/refresh',
            'GET  /api/v1/auth/me',
            'POST /api/v1/auth/logout'
        ]
    });
});

/* ==========================================================================
   3. AUTHENTICATION ROUTES
   ========================================================================== */

// 3.1 OAuth Consent URL Generator
app.get('/api/v1/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID.apps.googleusercontent.com';
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/callback';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;
    res.json({ success: true, message: 'Google OAuth Consent URL generated', authUrl });
});

// 3.2 Google OAuth Callback / Login
app.post('/api/v1/auth/google/callback', async (req, res, next) => {
    try {
        const { googleProfile } = req.body;

        if (!googleProfile || !googleProfile.email) {
            return res.status(400).json({ success: false, error: 'Invalid Payload', message: 'Valid Google Profile email is required' });
        }

        // Find existing user or insert into database
        let user = await Database.findUserByEmail(googleProfile.email);
        if (!user) {
            user = await Database.createUser({
                id: `usr-uuid-${Date.now()}`,
                google_id: googleProfile.sub || `google-${Date.now()}`,
                email: googleProfile.email,
                full_name: googleProfile.name || 'Anonymous User',
                profile_picture: googleProfile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                blood_group: googleProfile.bloodGroup || 'O-',
                role: 'donor'
            });
        }

        // Issue JWT Access Token & Refresh Token
        const accessToken = authService.generateAccessToken(user);
        const { token: refreshToken } = authService.generateRefreshToken(user.id);

        // Set Secure HTTP-Only Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Authenticated successfully',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name || user.name,
                bloodGroup: user.blood_group || user.bloodType || 'O-',
                role: user.role || 'donor'
            }
        });
    } catch (err) {
        next(err);
    }
});

// 3.3 Token Refresh Route
app.post('/api/v1/auth/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Refresh token required' });
        }

        const decoded = authService.verifyRefreshToken(refreshToken);
        const user = await Database.findUserById(decoded.sub);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User profile no longer exists' });
        }

        const newAccessToken = authService.generateAccessToken(user);
        res.json({ success: true, accessToken: newAccessToken });
    } catch (err) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: err.message });
    }
});

// 3.4 Authenticated Profile Endpoint
app.get('/api/v1/auth/me', authenticateJWT, async (req, res, next) => {
    try {
        const user = await Database.findUserById(req.user.sub);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Not Found', message: 'User record not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

// 3.5 Logout Endpoint
app.post('/api/v1/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    authService.revokeSession(refreshToken, accessToken);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

/* ==========================================================================
   4. DONOR DATABASE API ENDPOINTS
   ========================================================================== */

// 4.1 Search/List Donors
app.get('/api/v1/donors', async (req, res, next) => {
    try {
        const { bloodType, region, ready } = req.query;
        const donors = await Database.getDonors({ bloodType, region, ready });
        res.json({ success: true, count: donors.length, data: donors });
    } catch (err) {
        next(err);
    }
});

// 4.2 Get Specific Donor
app.get('/api/v1/donors/:id', async (req, res, next) => {
    try {
        const donor = await Database.getDonorById(req.params.id);
        if (!donor) {
            return res.status(404).json({ success: false, error: 'Not Found', message: 'Donor not found' });
        }
        res.json({ success: true, data: donor });
    } catch (err) {
        next(err);
    }
});

// 4.3 Register New Donor
app.post('/api/v1/donors', validateDonorPayload, async (req, res, next) => {
    try {
        const newDonor = await Database.createDonor(req.body);
        res.status(201).json({ success: true, message: 'Donor registered successfully in database', data: newDonor });
    } catch (err) {
        next(err);
    }
});

// 4.4 Update Donor Profile
app.put('/api/v1/donors/:id', validateDonorPayload, async (req, res, next) => {
    try {
        const updated = await Database.updateDonor(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Not Found', message: 'Donor not found for update' });
        }
        res.json({ success: true, message: 'Donor profile updated in database', data: updated });
    } catch (err) {
        next(err);
    }
});

// 4.5 Delete Donor (Requires Auth)
app.delete('/api/v1/donors/:id', authenticateJWT, requireRole('hospital_admin', 'super_admin'), async (req, res, next) => {
    try {
        const deleted = await Database.deleteDonor(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Not Found', message: 'Donor not found' });
        }
        res.json({ success: true, message: 'Donor deleted from database' });
    } catch (err) {
        next(err);
    }
});

/* ==========================================================================
   5. BLOOD INVENTORY & EMERGENCY REQUESTS API
   ========================================================================== */

// 5.1 Get Regional Blood Inventory
app.get('/api/v1/inventory', async (req, res, next) => {
    try {
        const inventory = await Database.getInventory();
        res.json({ success: true, data: inventory });
    } catch (err) {
        next(err);
    }
});

// 5.2 Update Regional Inventory
app.put('/api/v1/inventory', authenticateJWT, requireRole('hospital_admin', 'super_admin'), async (req, res, next) => {
    try {
        const { region, bloodType, units } = req.body;
        if (!region || !bloodType || units === undefined) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: 'region, bloodType, and units required' });
        }
        const updated = await Database.updateInventory(region, bloodType, Number(units));
        res.json({ success: true, message: 'Inventory updated', data: updated });
    } catch (err) {
        next(err);
    }
});

// 5.3 Get Emergency Requests
app.get('/api/v1/requests', async (req, res, next) => {
    try {
        const requests = await Database.getEmergencyRequests();
        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        next(err);
    }
});

// 5.4 Create Emergency Blood Request
app.post('/api/v1/requests', validateEmergencyRequest, async (req, res, next) => {
    try {
        const newReq = await Database.createEmergencyRequest(req.body);
        res.status(201).json({ success: true, message: 'Emergency request submitted successfully', data: newReq });
    } catch (err) {
        next(err);
    }
});

// 5.5 Update Emergency Request Status
app.patch('/api/v1/requests/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, error: 'Validation Error', message: 'Status required' });
        }
        const updated = await Database.updateRequestStatus(req.params.id, status);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Not Found', message: 'Emergency request not found' });
        }
        res.json({ success: true, message: 'Request status updated', data: updated });
    } catch (err) {
        next(err);
    }
});

/* ==========================================================================
   6. ABO COMPATIBILITY ENGINE API & AUDIT LEDGER
   ========================================================================== */

const ABO_RULES = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

// 6.1 Medical Compatibility Validator Endpoint
app.post('/api/v1/compatibility/check', (req, res) => {
    const { recipientBloodType, donorBloodType } = req.body;

    if (!recipientBloodType || !donorBloodType) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Both recipientBloodType and donorBloodType are required' });
    }

    const rType = recipientBloodType.toUpperCase();
    const dType = donorBloodType.toUpperCase();

    if (!VALID_BLOOD_GROUPS.includes(rType) || !VALID_BLOOD_GROUPS.includes(dType)) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid blood type provided' });
    }

    const allowedDonors = ABO_RULES[rType] || [];
    const isCompatible = allowedDonors.includes(dType);

    res.json({
        success: true,
        recipientBloodType: rType,
        donorBloodType: dType,
        isCompatible,
        allowedDonorTypes: allowedDonors,
        medicalNotice: isCompatible 
            ? `Donor ${dType} is medically safe for recipient ${rType}.`
            : `WARNING: ${dType} is incompatible with recipient ${rType}! Safe donors: ${allowedDonors.join(', ')}.`
    });
});

// 6.2 Audit Ledger Endpoint
app.get('/api/v1/ledger', async (req, res, next) => {
    try {
        const ledger = await Database.getLedger();
        res.json({ success: true, count: ledger.length, data: ledger });
    } catch (err) {
        next(err);
    }
});

/* ==========================================================================
   7. CENTRALIZED ERROR HANDLING & 404 CATCH-ALL
   ========================================================================== */

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist`
    });
});

// Production Error Handler (Hides internal stack traces)
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'An internal error occurred on the server'
            : err.message
    });
});

/* ==========================================================================
   8. SERVER LISTEN
   ========================================================================== */
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  PulseRed API & Database Server running on port ${PORT} `);
    console.log(`  Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`=======================================================`);
});
