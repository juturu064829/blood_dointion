/* ==========================================================================
   PULSERED - Standard Bearer Authorization Unit & Integration Test Suite
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const app = require('../src/app');
const authService = require('../src/services/authService');
const http = require('http');

// Helper function to send HTTP requests to test Express app
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

test('1. Public endpoints remain accessible without authentication', async () => {
    const res = await makeRequest('/api/v1/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'online');
});

test('2. Successful login returns access token with Bearer metadata', async () => {
    const email = `bearer.user.${Date.now()}@pulsered.org`;
    const password = 'BearerTestPassword123!';

    await authService.registerUser({
        name: 'Bearer Test User',
        email,
        password,
        role: 'ADMIN'
    });

    const res = await makeRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.accessToken || res.body.token, 'Response must return access token');
    assert.strictEqual(res.body.tokenType, 'Bearer', 'Token type must be Bearer');
});

test('3. Protected endpoints allow access with valid Authorization: Bearer <token>', async () => {
    const email = `bearer.valid.${Date.now()}@pulsered.org`;
    const password = 'ValidPassword123!';

    const reg = await authService.registerUser({
        name: 'Valid Bearer User',
        email,
        password,
        role: 'ADMIN'
    });

    const token = reg.token;

    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.email, email);
});

test('4. Protected endpoints reject missing Authorization header with 401 Unauthorized', async () => {
    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET'
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Unauthorized');
    assert.ok(res.body.message.includes('Authentication token required'));
});

test('5. Protected endpoints reject custom authorization schemes (Token, JWT, Custom) with 401 Unauthorized', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.signature';

    // Test with "Token <token>" custom format
    const resCustomToken = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': `Token ${fakeToken}` }
    });
    assert.strictEqual(resCustomToken.statusCode, 401);
    assert.strictEqual(resCustomToken.body.error, 'Unauthorized');
    assert.ok(resCustomToken.body.message.includes('Malformed authorization header'));

    // Test with "JWT <token>" custom format
    const resCustomJwt = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': `JWT ${fakeToken}` }
    });
    assert.strictEqual(resCustomJwt.statusCode, 401);
    assert.strictEqual(resCustomJwt.body.error, 'Unauthorized');

    // Test with raw token without Bearer prefix
    const resRawToken = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': fakeToken }
    });
    assert.strictEqual(resRawToken.statusCode, 401);
    assert.strictEqual(resRawToken.body.error, 'Unauthorized');
});

test('6. Protected endpoints reject empty Bearer token with 401 Unauthorized', async () => {
    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
    assert.strictEqual(res.body.success, false);
});

test('7. Protected endpoints reject invalid or expired Bearer token with 401 Unauthorized', async () => {
    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalid.jwt.token' }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
    assert.ok(res.body.message.includes('Invalid or expired token'));
});

test('8. Role-based authorization enforces 403 Forbidden for insufficient role, 401 for unauthenticated', async () => {
    const email = `donor.role.${Date.now()}@pulsered.org`;
    const password = 'DonorPassword123!';

    const reg = await authService.registerUser({
        name: 'Donor User',
        email,
        password,
        role: 'DONOR'
    });

    // Attempting admin route with DONOR role Bearer token -> 403 Forbidden
    const resDonor = await makeRequest('/api/v1/admin/stats', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${reg.token}` }
    });
    assert.strictEqual(resDonor.statusCode, 403);
    assert.strictEqual(resDonor.body.error, 'Forbidden');

    // Attempting admin route with NO Bearer token -> 401 Unauthorized
    const resNoAuth = await makeRequest('/api/v1/admin/stats', {
        method: 'GET'
    });
    assert.strictEqual(resNoAuth.statusCode, 401);
    assert.strictEqual(resNoAuth.body.error, 'Unauthorized');
});
