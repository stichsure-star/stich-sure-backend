const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhoneNumber } = require('../utils/designerContact');

test('normalizes local Nigerian phone numbers to E.164 format', () => {
  assert.equal(normalizePhoneNumber('08012345678'), '+2348012345678');
  assert.equal(normalizePhoneNumber('08123456789'), '+2348123456789');
});

test('preserves already formatted international numbers', () => {
  assert.equal(normalizePhoneNumber('+2347026289033'), '+2347026289033');
  assert.equal(normalizePhoneNumber('2347026289033'), '+2347026289033');
});
