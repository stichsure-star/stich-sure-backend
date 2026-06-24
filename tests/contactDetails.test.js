const test = require('node:test');
const assert = require('node:assert/strict');
const { getDesignerContactDetails } = require('../utils/designerContact');

test('uses phoneNumber and currentHouseAddress from designer profile when present', () => {
  const result = getDesignerContactDetails(
    {
      phoneNumber: '123456789',
      currentHouseAddress: '10 Main Street',
    },
    { phone: '000', address: 'fallback' }
  );

  assert.deepEqual(result, {
    phone: '123456789',
    address: '10 Main Street',
  });
});

test('falls back to the designer model phone and address when profile fields are missing', () => {
  const result = getDesignerContactDetails(
    { id: 'profile-1' },
    { phone: '5550000', address: '42 River Road' }
  );

  assert.deepEqual(result, {
    phone: '5550000',
    address: '42 River Road',
  });
});
