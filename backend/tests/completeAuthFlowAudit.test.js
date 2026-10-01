/* ==========================================================================
   PULSERED - Complete End-to-End JWT Authentication Audit Test Suite
   ========================================================================== */

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('http');

const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS } = require('../src/config/jwtConfig');
const authService = require('../src/services/authService');
const authRoutes = require('../src/routes/authRoutes');
const userRoutes = require('../src/routes/userRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const errorHandler = require('../src/middleware/errorHandler');
const { fallbackCorsMiddleware } = require('../src/config/corsConfig');

function customCookieParser(req, res, next) {
    req.cookies = req.cookies || {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                req.cookies[name] = decodeURIComponent(val);
            }
        });
    }
    next();
}

function createFullTestApp() {
    const app = express();
    app.use(fallbackCorsMiddleware);
    app.use(express.json());
    app.use(customCookieParser);

    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/admin', adminRoutes);

    app.use(errorHandler);
    return app;
}

test('COMPLETE AUDIT: Full JWT Auth Lifecycle (Login -> Bearer Request -> Protected API -> Token Expiration -> Refresh -> Logout -> Re-login)', async () => {
    const app = createFullTestApp();
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;

    try {
        // --- 1. Audit Registration & Password Hashing ---
        const userEmail = `audituser-${Date.now()}@example.com`;
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Audit User',
                email: userEmail,
                password: 'AuditPassword123!',
                confirmPassword: 'AuditPassword123!',
                phone: `+91 912${Math.floor(1000000 + Math.random() * 9000000)}`
            })
        });

        assert.equal(regRes.status, 201, 'Registration should return 201 Created');
        const regData = await regRes.json();
        assert.equal(regData.success, true);
        assert.ok(regData.token, 'Register returns access token');
        assert.ok(regData.refreshToken, 'Register returns refresh token');

        // --- 2. Audit Login & JWT Payload Schema ---
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                password: 'AuditPassword123!'
            })
        });

        assert.equal(loginRes.status, 200, 'Login should return 200 OK');
        const loginData = await loginRes.json();
        const accessToken = loginData.accessToken || loginData.token;
        const refreshToken = loginData.refreshToken;

        assert.ok(accessToken, 'Login must yield access token');
        assert.ok(refreshToken, 'Login must yield refresh token');

        // Verify Access Token Payload Schema (sub, user_id, iat, exp, alg)
        const verifiedAccess = authService.verifyJwt(accessToken);
        assert.ok(verifiedAccess.sub, 'Access token payload must contain sub');
        assert.ok(verifiedAccess.user_id, 'Access token payload must contain user_id');
        assert.ok(verifiedAccess.iat, 'Access token payload must contain iat');
        assert.ok(verifiedAccess.exp, 'Access token payload must contain exp');
        assert.equal(verifiedAccess.passwordHash, undefined, 'Access token must NOT contain password hash');

        // --- 3. Audit Bearer Token Protected API Request (/auth/me) ---
        const meRes = await fetch(`${baseUrl}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        assert.equal(meRes.status, 200, 'Protected endpoint /auth/me should accept valid Bearer token');
        const meData = await meRes.json();
        assert.equal(meData.success, true);
        assert.equal(meData.user.email, userEmail);

        // --- 4. Audit Role Authorization Enforcement (403 Forbidden for Non-Admin) ---
        const adminRes = await fetch(`${baseUrl}/admin/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        assert.equal(adminRes.status, 403, 'Donor user accessing admin route should return 403 Forbidden');

        // --- 5. Audit Token Expiration Behavior (Short-Lived Access Token Expired) ---
        // Create an expired access token
        const expiredAccessToken = authService.signJwt({ sub: meData.user.id }, JWT_SECRET, -5); // expired 5 mins ago
        const expiredRes = await fetch(`${baseUrl}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${expiredAccessToken}`
            }
        });

        assert.equal(expiredRes.status, 401, 'Expired access token must be rejected with 401 Unauthorized');

        // --- 6. Audit Refresh Token Rotation (/auth/refresh) ---
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        assert.equal(refreshRes.status, 200, 'Refresh endpoint should return 200 OK');
        const refreshData = await refreshRes.json();
        assert.ok(refreshData.accessToken, 'Refresh endpoint returns new access token');
        assert.ok(refreshData.refreshToken, 'Refresh endpoint returns rotated refresh token');
        assert.notEqual(refreshData.refreshToken, refreshToken, 'Rotated refresh token must differ from old refresh token');

        const newAccessToken = refreshData.accessToken;
        const newRefreshToken = refreshData.refreshToken;

        // Verify new access token works for protected API
        const mePostRefresh = await fetch(`${baseUrl}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${newAccessToken}`
            }
        });
        assert.equal(mePostRefresh.status, 200, 'New access token after refresh must access protected API');

        // --- 7. Audit Reuse Detection (Attempting to reuse old refresh token) ---
        const reuseRes = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        assert.equal(reuseRes.status, 401, 'Reusing previous refresh token must fail with 401');

        // --- 8. Audit Logout & Invalidation ---
        const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken: newRefreshToken })
        });
        assert.equal(logoutRes.status, 200, 'Logout should succeed');

        // Verify refresh token is revoked after logout
        const postLogoutRefresh = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: newRefreshToken })
        });
        assert.equal(postLogoutRefresh.status, 401, 'Revoked refresh token post-logout must return 401');

        // --- 9. Audit Re-login Flow ---
        const reloginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                password: 'AuditPassword123!'
            })
        });
        assert.equal(reloginRes.status, 200, 'User can log back in successfully');
        const reloginData = await reloginRes.json();
        assert.ok(reloginData.accessToken);

    } finally {
        server.close();
    }
});
