/* ==========================================================================
   PULSERED - Centralized CORS & Trusted Origins Security Configuration
   ========================================================================== */

const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4000',
    'http://127.0.0.1:4000'
];

function getAllowedOrigins() {
    if (process.env.ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS) {
        const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS;
        return raw.split(',').map(o => o.trim()).filter(Boolean);
    }
    return DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(origin) {
    if (!origin) return true; // Allow same-origin/non-browser requests (server-to-server, curl)
    const allowedList = getAllowedOrigins();
    if (allowedList.includes(origin)) return true;

    // In non-production, allow local dev servers on localhost / 127.0.0.1 on any port
    if (process.env.NODE_ENV !== 'production') {
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return true;
        }
    }
    return false;
}

function corsOptionsDelegate(req, callback) {
    const origin = req.header('Origin');
    if (isOriginAllowed(origin)) {
        callback(null, {
            origin: origin || true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            exposedHeaders: ['Authorization'],
            maxAge: 86400
        });
    } else {
        callback(new Error(`CORS Policy Security Violation: Origin '${origin}' is not authorized.`));
    }
}

function fallbackCorsMiddleware(req, res, next) {
    const origin = req.headers.origin;
    if (isOriginAllowed(origin)) {
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Vary', 'Origin');
        } else {
            res.header('Access-Control-Allow-Origin', '*');
        }
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Expose-Headers', 'Authorization');
        if (req.method === 'OPTIONS') return res.sendStatus(204);
        next();
    } else {
        if (req.method === 'OPTIONS') {
            return res.status(403).json({ success: false, error: 'Forbidden', message: `CORS Policy Violation: Origin '${origin}' not allowed.` });
        }
        next();
    }
}

module.exports = {
    DEFAULT_ALLOWED_ORIGINS,
    getAllowedOrigins,
    isOriginAllowed,
    corsOptionsDelegate,
    fallbackCorsMiddleware
};
