/* ==========================================================================
   PULSERED - Express Application Setup & Route Assembly
   Includes: Helmet Headers, CORS, Rate Limiter, REST API, Swagger UI
   ========================================================================== */

const express = require('express');
const errorHandler = require('./middleware/errorHandler');

// Safe imports with fallback
let cors, helmet, rateLimit, setupSwagger;
try { cors = require('cors'); } catch (e) {}
try { helmet = require('helmet'); } catch (e) {}
try { rateLimit = require('express-rate-limit'); } catch (e) {}
try { setupSwagger = require('./utils/swagger'); } catch (e) {}

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const donorRoutes = require('./routes/donorRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();

// Security Middlewares
if (helmet) app.use(helmet({ contentSecurityPolicy: false }));
if (cors) {
    app.use(cors({ origin: true, credentials: true }));
} else {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        if (req.method === 'OPTIONS') return res.sendStatus(200);
        next();
    });
}
app.use(express.json());

// Rate Limiter on Authentication Endpoints
if (rateLimit) {
    const authRateLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
    });
    app.use('/api/auth', authRateLimiter);
}

// OpenAPI / Swagger Documentation
if (setupSwagger) {
    try { setupSwagger(app); } catch (e) {}
}

// Mount API Routes (Supports both /api and /api/v1)
app.use(['/api/auth', '/api/v1/auth'], authRoutes);
app.use(['/api/users', '/api/v1/users'], userRoutes);
app.use(['/api/donors', '/api/v1/donors'], donorRoutes);
app.use(['/api/blood-requests', '/api/v1/blood-requests', '/api/v1/requests'], requestRoutes);
app.use(['/api/notifications', '/api/v1/notifications'], notificationRoutes);
app.use(['/api/admin', '/api/v1/admin'], adminRoutes);
app.use(['/api/locations', '/api/v1/locations'], locationRoutes);

const path = require('path');

// Serve static web frontend from root workspace
app.use(express.static(path.join(__dirname, '../../')));

// Health Check Endpoint
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
    res.json({
        status: 'online',
        service: 'PulseRed Full-Stack Blood Donation Core API',
        state: 'Andhra Pradesh',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        documentation: '/api-docs'
    });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
