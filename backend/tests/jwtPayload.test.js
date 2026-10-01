/* ==========================================================================
   PULSERED - Standardized JWT Payload Claims Unit & Integration Test Suite
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const authService = require('../src/services/authService');

test('1. Generated JWT payload contains sub, user_id, iat, and exp claims', () => {
    const user = {
        id: 'usr-payload-001',
        email: 'standard.jwt@pulsered.org',
        name: 'Standard User',
        role: 'DONOR'
    };

    const token = authService.generateToken(user);
    const decoded = authService.verifyJwt(token);

    assert.strictEqual(decoded.sub, 'usr-payload-001', 'sub claim must match user ID');
    assert.strictEqual(decoded.user_id, 'usr-payload-001', 'user_id claim must match user ID');
    assert.ok(typeof decoded.iat === 'number', 'iat claim must be numeric timestamp');
    assert.ok(typeof decoded.exp === 'number', 'exp claim must be numeric timestamp');
    assert.ok(decoded.exp > decoded.iat, 'exp must be greater than iat');
});

test('2. JWT payload does NOT contain password, passwordHash, or sensitive PII', () => {
    const user = {
        id: 'usr-secure-002',
        email: 'secure.user@pulsered.org',
        name: 'Secure User',
        passwordHash: '89a1f2b:secret_hash_value_that_must_never_leak',
        creditCard: '4111-2222-3333-4444'
    };

    const token = authService.generateToken(user);
    const decoded = authService.verifyJwt(token);

    assert.strictEqual(decoded.password, undefined, 'password must not be present in JWT');
    assert.strictEqual(decoded.passwordHash, undefined, 'passwordHash must not be present in JWT');
    assert.strictEqual(decoded.creditCard, undefined, 'sensitive payment data must not be present in JWT');
});

test('3. Verification rejects tokens missing iat or subject claims', () => {
    const crypto = require('crypto');
    const { JWT_SECRET, JWT_ALGORITHM } = require('../src/config/jwtConfig');
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const header = b64({ alg: JWT_ALGORITHM, typ: 'JWT' });

    // Missing iat
    const payloadNoIat = b64({ sub: 'usr-1', user_id: 'usr-1', exp: Math.floor(Date.now() / 1000) + 3600 });
    const sigNoIat = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payloadNoIat}`).digest('base64url');
    const tokenNoIat = `${header}.${payloadNoIat}.${sigNoIat}`;

    assert.throws(
        () => authService.verifyJwt(tokenNoIat),
        (err) => err.message.includes('issued-at (iat)')
    );

    // Missing sub/user_id/id
    const payloadNoSub = b64({ iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 });
    const sigNoSub = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payloadNoSub}`).digest('base64url');
    const tokenNoSub = `${header}.${payloadNoSub}.${sigNoSub}`;

    assert.throws(
        () => authService.verifyJwt(tokenNoSub),
        (err) => err.message.includes('subject identification missing')
    );
});
