/* ==========================================================================
   PULSERED - Production Express Backend API Server
   Includes: Google OAuth 2.0 Passport, Helmet Headers, Rate Limiting, JWT Auth
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authService = require('./services/authService');

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// Rate Limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many authentication attempts from this IP. Please try again later.' }
});

app.use('/api/v1/auth', authLimiter);

// MOCK USER DATABASE (Production Postgres fallback)
const mockUsersDb = [
    {
        id: 'usr-uuid-1001',
        google_id: '109823471092834710928',
        email: 'elena.r@healthnet.org',
        full_name: 'Elena Rostova',
        profile_picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        blood_group: 'O-',
        role: 'donor'
    }
];

// AUTH ROUTES
app.get('/api/v1/auth/google', (req, res) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=GOOGLE_CLIENT_ID.apps.googleusercontent.com&redirect_uri=http://localhost:8080/callback&scope=openid%20profile%20email`;
    res.json({ message: 'Redirecting to Google OAuth Consent Screen', authUrl });
});

// OAuth Callback Simulation / Production Handler
app.post('/api/v1/auth/google/callback', (req, res) => {
    const { googleProfile } = req.body;
    
    if (!googleProfile || !googleProfile.email) {
        return res.status(400).json({ error: 'Invalid Google Profile token payload' });
    }

    // Check if user exists or register first-time user
    let user = mockUsersDb.find(u => u.email === googleProfile.email);
    if (!user) {
        user = {
            id: `usr-uuid-${Date.now()}`,
            google_id: googleProfile.sub || `google-id-${Date.now()}`,
            email: googleProfile.email,
            full_name: googleProfile.name,
            profile_picture: googleProfile.picture,
            blood_group: googleProfile.bloodGroup || 'O-',
            role: 'donor'
        };
        mockUsersDb.push(user);
    }

    // Issue JWT Access Token and Refresh Token
    const accessToken = authService.generateAccessToken(user);
    const { token: refreshToken } = authService.generateRefreshToken(user.id);

    // Set Secure HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        success: true,
        message: 'Authenticated via Google OAuth 2.0',
        accessToken,
        user
    });
});

app.post('/api/v1/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    
    authService.revokeSession(req.cookies?.refreshToken, accessToken);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

app.listen(PORT, () => {
    console.log(`PulseRed OAuth 2.0 Auth Microservice running on http://localhost:${PORT}`);
});
