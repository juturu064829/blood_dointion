/* ==========================================================================
   PULSERED - JWT Token Expiration & Validation Unit & Integration Test Suite
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const authService = require('../src/services/authService');
const { getAccessTokenExpireMinutes } = require('../src/config/jwtConfig');
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

test('1. Generated JWT includes valid numeric exp claim based on ACCESS_TOKEN_EXPIRE_MINUTES', () => {
    const payload = { id: 'usr-exp-1', email: 'exp.test@example.com', role: 'DONOR' };
    const token = authService.signJwt(payload);
    
    assert.ok(typeof token === 'string');
    const decoded = authService.verifyJwt(token);

    assert.ok(decoded.exp, 'JWT must contain exp claim');
    assert.strictEqual(typeof decoded.exp, 'number');

    const expectedMinExp = Math.floor(Date.now() / 1000) + 55 * 60; // Should be around +60 minutes
    const expectedMaxExp = Math.floor(Date.now() / 1000) + 65 * 60;
    assert.ok(decoded.exp >= expectedMinExp && decoded.exp <= expectedMaxExp, 'exp claim must reflect central expiration setting');
});

test('2. Central expiration setting respects ACCESS_TOKEN_EXPIRE_MINUTES environment variable', () => {
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '15';
    const payload = { id: 'usr-env-1', email: 'env.test@example.com', role: 'DONOR' };
    
    const token = authService.signJwt(payload, undefined, 15);
    const decoded = authService.verifyJwt(token);

    const expectedMinExp = Math.floor(Date.now() / 1000) + 14 * 60;
    const expectedMaxExp = Math.floor(Date.now() / 1000) + 16 * 60;

    assert.ok(decoded.exp >= expectedMinExp && decoded.exp <= expectedMaxExp, 'JWT expiration claim must match ACCESS_TOKEN_EXPIRE_MINUTES');
    delete process.env.ACCESS_TOKEN_EXPIRE_MINUTES;
});

test('3. Backend automatically rejects expired JWT tokens with 401 Unauthorized', async () => {
    // Generate an already-expired token (-10 seconds)
    const payload = { id: 'usr-expired', email: 'expired@example.com', role: 'DONOR' };
    const expiredToken = authService.signJwt(payload, undefined, -1); // -1 minute expiry

    // Verify raw service throws
    assert.throws(
        () => authService.verifyJwt(expiredToken),
        (err) => err.message === 'Token expired'
    );

    // Verify HTTP endpoint returns 401 Unauthorized
    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${expiredToken}`
        }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
    assert.ok(res.body.message.includes('Invalid or expired token'));
});

test('4. Backend rejects tokens missing expiration claim (exp) with 401 Unauthorized', async () => {
    // Manually construct token without exp claim
    const crypto = require('crypto');
    const { JWT_SECRET, JWT_ALGORITHM } = require('../src/config/jwtConfig');
    
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const header = b64({ alg: JWT_ALGORITHM, typ: 'JWT' });
    const payloadNoExp = b64({ id: 'usr-no-exp', email: 'noexp@example.com', role: 'DONOR', iat: Math.floor(Date.now() / 1000) }); // No exp claim
    
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payloadNoExp}`)
        .digest('base64url');

    const tokenNoExp = `${header}.${payloadNoExp}.${signature}`;

    // Verify raw service throws
    assert.throws(
        () => authService.verifyJwt(tokenNoExp),
        (err) => err.message === 'Token expiration claim missing'
    );

    // Verify HTTP endpoint returns 401 Unauthorized
    const res = await makeRequest('/api/v1/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenNoExp}`
        }
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
});
