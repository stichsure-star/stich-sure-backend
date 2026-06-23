const assert = require('assert');
const test = require('node:test');
const orderController = require('../controller/order');

test('buildVerifiedPaymentInclude should not require a payment record', () => {
  const include = orderController.buildVerifiedPaymentInclude();
  assert.strictEqual(include.required, false);
});
