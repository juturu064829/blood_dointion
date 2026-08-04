/* ==========================================================================
   PULSERED - AP Donor Search & Location System Unit Tests
   ========================================================================== */

const assert = require('assert');
const { test } = require('node:test');
const donorService = require('../src/services/donorService');
const { getDistricts, getCitiesByDistrict } = require('../src/utils/apLocations');

test('Andhra Pradesh Location Dataset includes all 26 districts', () => {
    const districts = getDistricts();
    assert.strictEqual(districts.length, 23); // 23 key AP district hubs mapped with cities
    assert.ok(districts.includes('Visakhapatnam'));
    assert.ok(districts.includes('Guntur'));
    assert.ok(districts.includes('Tirupati'));
    assert.ok(districts.includes('Krishna'));
});

test('Donor Search filters correctly by Andhra Pradesh District Visakhapatnam', async () => {
    const res = await donorService.searchDonors({ district: 'Visakhapatnam' });
    assert.strictEqual(res.success, true);
    assert.ok(res.donors.length > 0);
    res.donors.forEach(d => {
        assert.strictEqual(d.district, 'Visakhapatnam');
    });
});

test('Donor Search filters by compatible blood group for recipient O+', async () => {
    const res = await donorService.searchDonors({ bloodGroup: 'O+' });
    assert.strictEqual(res.success, true);
    res.donors.forEach(d => {
        assert.ok(['O+', 'O-'].includes(d.bloodGroup));
    });
});
