/* ==========================================================================
   PULSERED - CORS Security & Credentials Integration Test Suite
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

test('1. OPTIONS preflight request from trusted origin returns 204/200 with proper CORS headers', async () => {
    const trustedOrigin = 'http://localhost:8080';
    const res = await makeRequest('/api/v1/users/me', {
        method: 'OPTIONS',
        headers: {
            'Origin': trustedOrigin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization, Content-Type'
        }
    });

    assert.ok(res.statusCode === 204 || res.statusCode === 200, 'Preflight response must be 204 or 200');
    assert.strictEqual(res.headers['access-control-allow-origin'], trustedOrigin);
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    assert.ok(res.headers['access-control-allow-headers'].includes('Authorization'));
    assert.ok(res.headers['access-control-allow-methods'].includes('GET'));
});

test('2. Authenticated API request from trusted origin includes credentials and allowed origin headers', async () => {
    const trustedOrigin = 'http://localhost:3000';
    const email = `cors.user.${Date.now()}@pulsered.org`;
    const reg = await authService.registerUser({
        name: 'CORS Test User',
        email,
        password: 'CorsPassword123!'
    });

    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: {
            'Origin': trustedOrigin,
            'Authorization': `Bearer ${reg.token}`
        }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['access-control-allow-origin'], trustedOrigin);
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    assert.strictEqual(res.body.user.email, email);
});

test('3. Unauthenticated public API request returns proper CORS headers', async () => {
    const trustedOrigin = 'http://localhost:5173';
    const res = await makeRequest('/api/v1/health', {
        method: 'GET',
        headers: {
            'Origin': trustedOrigin
        }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['access-control-allow-origin'], trustedOrigin);
    assert.strictEqual(res.body.status, 'online');
});

test('4. Untrusted origin in production is rejected or omitted from Access-Control-Allow-Origin', async () => {
    const oldEnv = process.env.NODE_ENV;
    const oldAllowed = process.env.ALLOWED_ORIGINS;
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'http://localhost:8080,https://pulsered.org';

    const untrustedOrigin = 'https://malicious-website.com';
    const res = await makeRequest('/api/v1/health', {
        method: 'OPTIONS',
        headers: {
            'Origin': untrustedOrigin,
            'Access-Control-Request-Method': 'GET'
        }
    });

    assert.notStrictEqual(res.headers['access-control-allow-origin'], untrustedOrigin, 'Untrusted origin must not be allowed');

    process.env.NODE_ENV = oldEnv;
    if (oldAllowed) process.env.ALLOWED_ORIGINS = oldAllowed;
    else delete process.env.ALLOWED_ORIGINS;
});
