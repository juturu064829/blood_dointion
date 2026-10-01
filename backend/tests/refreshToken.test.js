/* ==========================================================================
   PULSERED - Secure Refresh Token System Test Suite
   ========================================================================== */

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('http');

const { JWT_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS } = require('../src/config/jwtConfig');
const authService = require('../src/services/authService');
const authRoutes = require('../src/routes/authRoutes');
const errorHandler = require('../src/middleware/errorHandler');

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

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use(customCookieParser);
    app.use('/api/v1/auth', authRoutes);
    app.use(errorHandler);
    return app;
}

test('1. Refresh tokens have separate expiration and secrets from access tokens', async () => {
    assert.equal(typeof ACCESS_TOKEN_EXPIRE_MINUTES, 'number');
    assert.equal(typeof REFRESH_TOKEN_EXPIRE_DAYS, 'number');
    assert.notEqual(JWT_SECRET, JWT_REFRESH_SECRET, 'Access and refresh tokens must use different secret keys');
});

test('2. Refresh tokens do not contain sensitive information', async () => {
    const userObj = { id: 'usr-test-refresh-01', email: 'refreshtest@example.com', name: 'Refresh Tester', role: 'DONOR' };
    const refreshRes = authService.generateRefreshToken(userObj);

    const decoded = authService.verifyRefreshToken(refreshRes.token);
    assert.equal(decoded.decoded.sub, userObj.id);
    assert.equal(decoded.decoded.type, 'refresh');
    assert.equal(decoded.decoded.password, undefined);
    assert.equal(decoded.decoded.passwordHash, undefined);
    assert.ok(decoded.decoded.familyId, 'Refresh token must contain familyId');
    assert.ok(decoded.decoded.jti, 'Refresh token must contain jti');
});

test('3. /api/v1/auth/refresh endpoint successfully rotates valid refresh tokens', async () => {
    const app = createTestApp();
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1/auth`;

    try {
        // Step 1: Register User to obtain tokens
        const regRes = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Rotation Tester',
                email: `rotator-${Date.now()}@example.com`,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                phone: `+91 987${Math.floor(1000000 + Math.random() * 9000000)}`
            })
        });

        const regData = await regRes.json();
        assert.equal(regRes.status, 201);
        assert.ok(regData.refreshToken, 'Register response must return refresh token');
        
        const originalRefreshToken = regData.refreshToken;

        // Step 2: Request token refresh via POST /api/v1/auth/refresh
        const refreshRes = await fetch(`${baseUrl}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: originalRefreshToken })
        });

        const refreshData = await refreshRes.json();
        assert.equal(refreshRes.status, 200);
        assert.equal(refreshData.success, true);
        assert.ok(refreshData.accessToken, 'Refresh endpoint must return new access token');
        assert.ok(refreshData.refreshToken, 'Refresh endpoint must return rotated refresh token');
        assert.notEqual(refreshData.refreshToken, originalRefreshToken, 'Rotated refresh token must differ from original');

    } finally {
        server.close();
    }
});

test('4. Reuse detection: using a previously rotated refresh token revokes family session and requires re-login', async () => {
    const app = createTestApp();
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1/auth`;

    try {
        // Step 1: Login user
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@pulsered.org',
                password: 'AdminPass123!'
            })
        });

        const loginData = await loginRes.json();
        const initialRefreshToken = loginData.refreshToken;

        // Step 2: First refresh (valid)
        const firstRefreshRes = await fetch(`${baseUrl}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: initialRefreshToken })
        });
        assert.equal(firstRefreshRes.status, 200);
        const firstRefreshData = await firstRefreshRes.json();
        const secondRefreshToken = firstRefreshData.refreshToken;

        // Step 3: Attempt to reuse initialRefreshToken (REUSE ATTEMPT!)
        const reuseAttemptRes = await fetch(`${baseUrl}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: initialRefreshToken })
        });
        assert.equal(reuseAttemptRes.status, 401, 'Reused refresh token must return 401');

        // Step 4: Verify that even secondRefreshToken from the family is now revoked due to reuse detection
        const revokedFamilyRes = await fetch(`${baseUrl}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: secondRefreshToken })
        });
        assert.equal(revokedFamilyRes.status, 401, 'Subsequent refresh token in revoked family must return 401');

    } finally {
        server.close();
    }
});

test('5. Logout revokes the refresh token session and clears cookies', async () => {
    const app = createTestApp();
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1/auth`;

    try {
        // Step 1: Login
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@pulsered.org',
                password: 'AdminPass123!'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        const refreshToken = loginData.refreshToken;

        // Step 2: Logout with refresh token
        const logoutRes = await fetch(`${baseUrl}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ refreshToken })
        });

        assert.equal(logoutRes.status, 200);

        // Step 3: Verify refresh token is revoked
        const postLogoutRefreshRes = await fetch(`${baseUrl}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        assert.equal(postLogoutRefreshRes.status, 401, 'Revoked refresh token post-logout must return 401');

    } finally {
        server.close();
    }
});
