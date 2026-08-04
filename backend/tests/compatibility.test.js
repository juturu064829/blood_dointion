/* ==========================================================================
   PULSERED - Blood Compatibility Unit Tests
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const { isBloodCompatible, getCompatibleDonorGroups, calculateMatchScore } = require('../src/utils/bloodCompatibility');

test('O- Universal Donor can donate to all blood groups', () => {
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    groups.forEach(recipient => {
        assert.strictEqual(isBloodCompatible('O-', recipient), true, `O- should be compatible with ${recipient}`);
    });
});

test('AB+ Universal Recipient can receive from all blood groups', () => {
    const compatible = getCompatibleDonorGroups('AB+');
    assert.strictEqual(compatible.length, 8);
});

test('O+ Can only receive from O+ and O-', () => {
    const compatible = getCompatibleDonorGroups('O+');
    assert.deepStrictEqual(compatible, ['O+', 'O-']);
});

test('Match score prioritizes exact blood type and same AP city', () => {
    const donor = { bloodGroup: 'O-', city: 'Visakhapatnam City', district: 'Visakhapatnam', state: 'Andhra Pradesh', available: true };
    const request = { bloodGroup: 'O-', city: 'Visakhapatnam City', district: 'Visakhapatnam', state: 'Andhra Pradesh' };

    const score = calculateMatchScore(donor, request);
    assert.ok(score >= 170, `Score ${score} should reflect exact blood match + same AP city + available status`);
});
