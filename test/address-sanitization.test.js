const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeAddressForShipbubble } = require('../utils/addressSanitizer');

test('removes emojis and restricted symbols from addresses before Shipbubble validation', () => {
  const input = '🏠 12, Plot 5/6, Opebi #12, Ikeja - Lagos';
  const result = sanitizeAddressForShipbubble(input);

  assert.equal(result, '12 Plot 5 6 Opebi 12 Ikeja Lagos');
});

test('removes common address abbreviations while preserving the core location details', () => {
  const input = 'No 8, Adebayo St. Road, Lekki Phase 1';
  const result = sanitizeAddressForShipbubble(input);

  assert.equal(result, '8 Adebayo Lekki Phase 1');
});
