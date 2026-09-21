/* ==========================================================================
   PULSERED - Real User Account, Multi-User Isolation & Auth Unit Tests
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const authService = require('../src/services/authService');

test('Scenario: Registration, Login (Email & Phone), User Profile Isolation, & Password Reset', async () => {
    const userAEmail = `usera.${Date.now()}@example.com`;
    const userAPhone = `+91 9111111111`;

    // 1. Register User A
    const regA = await authService.registerUser({
        name: 'Venkatesh Naidu (User A)',
        email: userAEmail,
        password: 'PasswordUserA123!',
        confirmPassword: 'PasswordUserA123!',
        phone: userAPhone,
        bloodGroup: 'O+',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        city: 'Guntur City',
        pincode: '522002'
    });

    assert.ok(regA.token, 'Token should be returned');
    assert.strictEqual(regA.user.name, 'Venkatesh Naidu (User A)');
    assert.strictEqual(regA.user.profile.bloodGroup, 'O+');
    assert.strictEqual(regA.user.profile.district, 'Guntur');

    // 2. Login User A via Email
    const loginA = await authService.loginUser({
        email: userAEmail,
        password: 'PasswordUserA123!'
    });
    assert.strictEqual(loginA.user.id, regA.user.id);

    // 3. Update User A Profile
    const updatedA = await authService.updateUserProfile(regA.user.id, {
        city: 'Tenali',
        availability: true,
        gender: 'Male'
    });
    assert.strictEqual(updatedA.profile.city, 'Tenali');

    // 4. Register User B
    const userBEmail = `userb.${Date.now()}@example.com`;
    const userBPhone = `+91 9222222222`;

    const regB = await authService.registerUser({
        name: 'Anitha Rao (User B)',
        email: userBEmail,
        password: 'PasswordUserB456!',
        phone: userBPhone,
        bloodGroup: 'B-',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        city: 'Visakhapatnam City'
    });

    // 5. Login User B via Mobile Phone
    const loginBPhone = await authService.loginUser({
        phone: userBPhone,
        password: 'PasswordUserB456!'
    });
    assert.strictEqual(loginBPhone.user.id, regB.user.id);
    assert.strictEqual(loginBPhone.user.name, 'Anitha Rao (User B)');

    // 6. User Data Isolation Verification
    // User B profile must be completely isolated from User A
    assert.notStrictEqual(loginBPhone.user.id, loginA.user.id);
    assert.strictEqual(loginBPhone.user.profile.bloodGroup, 'B-');
    assert.strictEqual(loginA.user.profile.bloodGroup, 'O+');

    // 7. Verify User A data persistence upon re-login
    const reloginA = await authService.loginUser({
        email: userAEmail,
        password: 'PasswordUserA123!'
    });
    assert.strictEqual(reloginA.user.profile.city, 'Tenali');

    // 8. Password Reset Flow
    const forgotRes = await authService.forgotPassword(userAEmail);
    assert.ok(forgotRes.resetToken, 'Reset token generated');

    const resetRes = await authService.resetPassword(forgotRes.resetToken, 'NewPassUserA999!');
    assert.ok(resetRes.message.includes('successfully'));

    // Login with new password
    const newLoginA = await authService.loginUser({
        email: userAEmail,
        password: 'NewPassUserA999!'
    });
    assert.strictEqual(newLoginA.user.id, regA.user.id);
});

test('Registration rejects duplicate email and duplicate mobile number', async () => {
    const dupEmail = `dup.${Date.now()}@example.com`;
    const dupPhone = `+91 9333333333`;

    await authService.registerUser({
        name: 'Initial User',
        email: dupEmail,
        password: 'Password123!',
        phone: dupPhone
    });

    // Attempt duplicate email
    await assert.rejects(
        async () => {
            await authService.registerUser({
                name: 'Dup Email User',
                email: dupEmail,
                password: 'Password123!',
                phone: '+91 9444444444'
            });
        },
        (err) => err.statusCode === 400 && err.message.includes('email')
    );

    // Attempt duplicate mobile
    await assert.rejects(
        async () => {
            await authService.registerUser({
                name: 'Dup Phone User',
                email: `other.${Date.now()}@example.com`,
                password: 'Password123!',
                phone: dupPhone
            });
        },
        (err) => err.statusCode === 400 && err.message.includes('Mobile')
    );
});

test('User registration hashes password and returns JWT token', async () => {
    const testEmail = `test.user.${Date.now()}@example.com`;
    const res = await authService.registerUser({
        name: 'Venkatesh Kumar',
        email: testEmail,
        password: 'SecurePassword123!',
        phone: '+91 9988776655'
    });

    assert.ok(res.token, 'Registration should return a JWT token');
    assert.strictEqual(typeof res.token, 'string');
    const decoded = authService.verifyJwt(res.token);
    assert.strictEqual(decoded.email, testEmail);
    assert.strictEqual(res.user.name, 'Venkatesh Kumar');
    assert.strictEqual(res.user.passwordHash, undefined, 'Password hash should be omitted from returned user object');
});

