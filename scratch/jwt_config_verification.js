const assert = require('assert');
const path = require('path');

console.log('--- Starting Centralized JWT Configuration & Algorithm Verification ---');

// 1. Verify backend/src/config/jwtConfig.js with process.env.JWT_SECRET_KEY
process.env.JWT_SECRET_KEY = 'test_jwt_secret_key_12345';
process.env.JWT_ALGORITHM = 'HS256';
delete process.env.JWT_SECRET;
process.env.NODE_ENV = 'development';

delete require.cache[require.resolve('../backend/src/config/jwtConfig')];
const backendConfig = require('../backend/src/config/jwtConfig');
assert.strictEqual(backendConfig.getJwtSecret(), 'test_jwt_secret_key_12345');
assert.strictEqual(backendConfig.getJwtAlgorithm(), 'HS256');
console.log('✓ backend/src/config/jwtConfig prefers JWT_SECRET_KEY & resolves JWT_ALGORITHM=HS256');

// 2. Verify fallback to JWT_SECRET if JWT_SECRET_KEY is absent
delete process.env.JWT_SECRET_KEY;
process.env.JWT_SECRET = 'fallback_jwt_secret_98765';
delete require.cache[require.resolve('../backend/src/config/jwtConfig')];
const fallbackConfig = require('../backend/src/config/jwtConfig');
assert.strictEqual(fallbackConfig.getJwtSecret(), 'fallback_jwt_secret_98765');
console.log('✓ backend/src/config/jwtConfig falls back to JWT_SECRET');

// 3. Verify Production Safety Check (throws error if no secret in prod)
delete process.env.JWT_SECRET_KEY;
delete process.env.JWT_SECRET;
process.env.NODE_ENV = 'production';
delete require.cache[require.resolve('../backend/src/config/jwtConfig')];
assert.throws(() => {
    require('../backend/src/config/jwtConfig');
}, /CRITICAL SECURITY CONFIGURATION ERROR/);
console.log('✓ Production security error check passed');

// 4. Reset env & Test server/config/jwtConfig.js
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET_KEY = 'server_jwt_secret_key_abc';
process.env.JWT_REFRESH_SECRET_KEY = 'server_refresh_secret_key_xyz';
process.env.JWT_ALGORITHM = 'HS256';
delete require.cache[require.resolve('../server/config/jwtConfig')];
const serverConfig = require('../server/config/jwtConfig');
assert.strictEqual(serverConfig.getJwtSecret(), 'server_jwt_secret_key_abc');
assert.strictEqual(serverConfig.getJwtRefreshSecret(), 'server_refresh_secret_key_xyz');
assert.strictEqual(serverConfig.getJwtAlgorithm(), 'HS256');
console.log('✓ server/config/jwtConfig correctly resolves JWT_SECRET_KEY, JWT_REFRESH_SECRET_KEY & JWT_ALGORITHM');

// 5. Test Token Generation & Verification with HS256 Algorithm
const authService = require('../backend/src/services/authService');
const testUser = { id: 'usr-123', email: 'test@pulsered.org', name: 'Test User', role: 'DONOR' };
const token = authService.generateToken(testUser);
assert.ok(token, 'Token generated');
const decoded = authService.verifyJwt(token);
assert.strictEqual(decoded.id, testUser.id);
assert.strictEqual(decoded.email, testUser.email);
console.log('✓ HS256 Token generation and verification succeeded');

// 6. Test Algorithm Mismatch Attack Prevention (e.g. spoofed "none" or "RS256" algorithm header)
function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Attack 1: Alg = "none"
const spoofedHeaderNone = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
const spoofedPayload = base64UrlEncode(JSON.stringify({ id: 'usr-attacker', email: 'attacker@pulsered.org', exp: Math.floor(Date.now() / 1000) + 3600 }));
const fakeTokenNone = `${spoofedHeaderNone}.${spoofedPayload}.fakesig`;

assert.throws(() => {
    authService.verifyJwt(fakeTokenNone);
}, /Algorithm mismatch/, 'Backend must reject token with alg "none"');
console.log('✓ Algorithm Mismatch Check: Blocked spoofed alg="none" token');

// Attack 2: Alg = "RS256"
const spoofedHeaderRS = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const fakeTokenRS = `${spoofedHeaderRS}.${spoofedPayload}.fakesig`;

assert.throws(() => {
    authService.verifyJwt(fakeTokenRS);
}, /Algorithm mismatch/, 'Backend must reject token with alg "RS256"');
console.log('✓ Algorithm Mismatch Check: Blocked spoofed alg="RS256" token');

console.log('--- ALL JWT ALGORITHM & SECURITY VERIFICATIONS PASSED ---');
