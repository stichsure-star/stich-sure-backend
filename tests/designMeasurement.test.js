const test = require('node:test');
const assert = require('node:assert/strict');
const { createDesignValidator } = require('../middlewares/bodyValidation');

test('create design validator accepts measurement as an array of strings', () => {
  let called = false;
  const req = {
    body: {
      designerId: '11111111-1111-1111-1111-111111111111',
      designTitle: 'Test',
      category: 'Bridal',
      price: 10,
      description: 'Test',
      measurement: ['Bust: 34', 'Waist: 26'],
    },
  };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
    },
  };

  createDesignValidator(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.deepEqual(req.body.measurement, ['Bust: 34', 'Waist: 26']);
});

test('create design validator accepts measurement as a single string', () => {
  let called = false;
  const req = {
    body: {
      designerId: '11111111-1111-1111-1111-111111111111',
      designTitle: 'Test',
      category: 'Bridal',
      price: 10,
      description: 'Test',
      measurement: 'Bust: 34',
    },
  };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
    },
  };

  createDesignValidator(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.body.measurement, 'Bust: 34');
});
