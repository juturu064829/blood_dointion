/* ==========================================================================
   PULSERED - Backend JWT Validation Audit & Middleware Test Suite
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const authService = require('../src/services/authService');
const { JWT_SECRET, JWT_ALGORITHM } = require('../src/config/jwtConfig');
const app = require('../src/app');
const http = require('http');

function makeRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
    return new Promise((resolve, reject) => {
        const server = app.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            const reqOptions = {
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            const req = http.request(reqOptions, (res) => {
                let resData = '';
                res.on('data', chunk => { resData += chunk; });
                res.on('end', () => {
                    server.close();
                    let parsed = null;
                    try {
                        parsed = JSON.parse(resData);
                    } catch (e) {
                        parsed = resData;
                    }
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
                });
            });

            req.on('error', (err) => {
                server.close();
                reject(err);
            });

            if (body) {
                req.write(typeof body === 'string' ? body : JSON.stringify(body));
            }
            req.end();
        });
    });
}

test('1. Valid token with database user identity succeeds and populates user profile', async () => {
    const email = `audit.user.${Date.now()}@pulsered.org`;
    const password = 'AuditUserPass123!';

    const reg = await authService.registerUser({
        name: 'Audit Validated User',
        email,
        password,
        role: 'DONOR'
    });

    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${reg.token}` }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.email, email);
    assert.strictEqual(res.body.user.name, 'Audit Validated User');
});

test('2. Token signed with invalid/wrong secret key is rejected with 401 Unauthorized', async () => {
    const wrongSecret = 'wrong_super_secret_key_1122334455';
    const payload = { sub: 'usr-admin-01', user_id: 'usr-admin-01', email: 'admin@pulsered.org', role: 'ADMIN' };
    
    const invalidToken = authService.signJwt(payload, wrongSecret);

    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${invalidToken}` }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
    assert.ok(res.body.message.includes('Invalid or expired token'));
});

test('3. Token with algorithm mismatch (e.g. alg: RS256 or HS512) is rejected with 401 Unauthorized', async () => {
    const crypto = require('crypto');
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    // Header with algorithm mismatch: HS512 instead of configured HS256
    const headerMismatch = b64({ alg: 'HS512', typ: 'JWT' });
    const payload = b64({
        sub: 'usr-admin-01',
        user_id: 'usr-admin-01',
        email: 'admin@pulsered.org',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    });

    const sig = crypto.createHmac('sha512', JWT_SECRET).update(`${headerMismatch}.${payload}`).digest('base64url');
    const tokenMismatch = `${headerMismatch}.${payload}.${sig}`;

    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${tokenMismatch}` }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
});

test('4. Token for non-existent or deleted user is rejected with 401 Unauthorized', async () => {
    const payloadNonExistent = {
        sub: 'usr-nonexistent-99999',
        user_id: 'usr-nonexistent-99999',
        email: 'deleted.user@example.com',
        role: 'DONOR'
    };

    const tokenNonExistent = authService.signJwt(payloadNonExistent);

    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${tokenNonExistent}` }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
    assert.ok(res.body.message.includes('no longer exists or is inactive'));
});

test('5. Error responses never leak JWT secrets or raw token contents', async () => {
    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalid.token.payload' }
    });

    assert.strictEqual(res.statusCode, 401);
    const resString = JSON.stringify(res.body);

    assert.strictEqual(resString.includes(JWT_SECRET), false, 'JWT secret must not be exposed in error body');
    assert.strictEqual(resString.includes('invalid.token.payload'), false, 'Raw token must not be exposed in error body');
});
