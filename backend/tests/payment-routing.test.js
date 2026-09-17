const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getInvestorProfileLabel,
  getAllowedPaymentMethodForInvestorProfile,
  getInvestorProfileOptions,
} = require('../src/utils/investorProfile');

test('routes domestic investors to fiat checkout only', () => {
  const profile = 'domestic';

  assert.equal(getInvestorProfileLabel(profile), 'Domestic investor');
  assert.deepEqual(getAllowedPaymentMethodForInvestorProfile(profile), ['gateway']);
});

test('routes international investors to crypto checkout only', () => {
  const profile = 'international';

  assert.equal(getInvestorProfileLabel(profile), 'International investor');
  assert.deepEqual(getAllowedPaymentMethodForInvestorProfile(profile), ['crypto']);
});

test('exposes the investor selection options used by the UI', () => {
  const options = getInvestorProfileOptions();

  assert.equal(options[0].value, 'domestic');
  assert.equal(options[1].value, 'international');
  assert.equal(options[0].paymentMethod, 'gateway');
  assert.equal(options[1].paymentMethod, 'crypto');
});
