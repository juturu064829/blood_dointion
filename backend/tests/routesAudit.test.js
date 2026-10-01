/* ==========================================================================
   PULSERED - Backend Routes Public vs Protected Audit Integration Test Suite
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const app = require('../src/app');
const authService = require('../src/services/authService');
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

test('1. Public endpoints allow unauthenticated access', async () => {
    // Health check
    const health = await makeRequest('/api/v1/health');
    assert.strictEqual(health.statusCode, 200);

    // Donor search
    const donorSearch = await makeRequest('/api/v1/donors/search?district=Visakhapatnam');
    assert.strictEqual(donorSearch.statusCode, 200);

    // Blood requests listing
    const requests = await makeRequest('/api/v1/blood-requests');
    assert.strictEqual(requests.statusCode, 200);

    // Location endpoints
    const districts = await makeRequest('/api/v1/locations/ap-districts');
    assert.strictEqual(districts.statusCode, 200);

    // Notifications
    const notifications = await makeRequest('/api/v1/notifications');
    assert.strictEqual(notifications.statusCode, 200);
});

test('2. Protected endpoints reject unauthenticated requests with 401 Unauthorized', async () => {
    const protectedRoutes = [
        { path: '/api/v1/auth/me', method: 'GET' },
        { path: '/api/v1/auth/me', method: 'PUT' },
        { path: '/api/v1/auth/logout', method: 'POST' },
        { path: '/api/v1/users/me', method: 'GET' },
        { path: '/api/v1/users/me', method: 'PUT' },
        { path: '/api/v1/donors/me', method: 'GET' },
        { path: '/api/v1/donors/me', method: 'PUT' },
        { path: '/api/v1/donors/me/availability', method: 'PATCH' },
        { path: '/api/v1/admin/stats', method: 'GET' },
        { path: '/api/v1/admin/users', method: 'GET' }
    ];

    for (const route of protectedRoutes) {
        const res = await makeRequest(route.path, { method: route.method });
        assert.strictEqual(res.statusCode, 401, `Route ${route.method} ${route.path} must return 401 Unauthorized when unauthenticated`);
        assert.strictEqual(res.body.error, 'Unauthorized');
    }
});

test('3. Protected user endpoints allow access when valid Bearer token is provided', async () => {
    const email = `route.user.${Date.now()}@pulsered.org`;
    const reg = await authService.registerUser({
        name: 'Route Test User',
        email,
        password: 'RoutePass123!'
    });

    const resMe = await makeRequest('/api/v1/auth/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${reg.token}` }
    });
    assert.strictEqual(resMe.statusCode, 200);
    assert.strictEqual(resMe.body.user.email, email);

    const resLogout = await makeRequest('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${reg.token}` }
    });
    assert.strictEqual(resLogout.statusCode, 200);
    assert.strictEqual(resLogout.body.success, true);
});

test('4. Admin protected endpoints return 403 Forbidden for non-admin authenticated users', async () => {
    const email = `donor.user.${Date.now()}@pulsered.org`;
    const reg = await authService.registerUser({
        name: 'Donor Non-Admin User',
        email,
        password: 'DonorPass123!',
        role: 'DONOR'
    });

    const resStats = await makeRequest('/api/v1/admin/stats', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${reg.token}` }
    });
    assert.strictEqual(resStats.statusCode, 403);
    assert.strictEqual(resStats.body.error, 'Forbidden');
});
