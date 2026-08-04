/* ==========================================================================
   PULSERED - Registration & Authentication Unit Tests
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const authService = require('../src/services/authService');

test('User registration hashes password and returns JWT token', async () => {
    const testEmail = `test.user.${Date.now()}@example.com`;
    const res = await authService.registerUser({
        name: 'Venkatesh Kumar',
        email: testEmail,
        password: 'SecurePassword123!',
        phone: '+91 9988776655',
        bloodGroup: 'O+',
        district: 'Guntur'
    });

    assert.strictEqual(res.user.email, testEmail);
    assert.strictEqual(res.user.name, 'Venkatesh Kumar');
    assert.ok(res.token);
    assert.strictEqual(res.user.passwordHash, undefined, 'Password hash should be sanitized out');
});

test('User login verifies password and returns valid JWT', async () => {
    const testEmail = `login.test.${Date.now()}@example.com`;
    await authService.registerUser({
        name: 'Anitha Naidu',
        email: testEmail,
        password: 'MyPassword999!',
        bloodGroup: 'A+',
        district: 'Visakhapatnam'
    });

    const loginRes = await authService.loginUser({
        email: testEmail,
        password: 'MyPassword999!'
    });

    assert.strictEqual(loginRes.user.email, testEmail);
    assert.ok(loginRes.token);
});

test('User login rejects incorrect password', async () => {
    const testEmail = `bad.pass.${Date.now()}@example.com`;
    await authService.registerUser({
        name: 'Bad Pass User',
        email: testEmail,
        password: 'CorrectPassword123!'
    });

    await assert.rejects(
        async () => {
            await authService.loginUser({ email: testEmail, password: 'WrongPassword!' });
        },
        (err) => {
            return err.statusCode === 401 && err.message === 'Invalid email or password.';
        }
    );
});
