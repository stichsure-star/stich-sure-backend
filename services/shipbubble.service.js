const axios = require('axios');

exports.validateAddress = async (payload) => {
  const res = await fetch(`${process.env.SHIPBUBBLE_BASE_URL}/shipping/address/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

exports.getShippingRates = async (payload) => {
  const res = await fetch(`${process.env.SHIPBUBBLE_BASE_URL}/shipping/fetch_rates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

exports.createShipment = async (payload) => {
  const res = await fetch(`${process.env.SHIPBUBBLE_BASE_URL}/shipping/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

exports.trackShipment = async (orderId) => {
  const res = await fetch(`${process.env.SHIPBUBBLE_BASE_URL}/shipping/tracking?order_id=${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
};

exports.getPackageCategories = async () => {
  const res = await fetch(`${process.env.SHIPBUBBLE_BASE_URL}/shipping/labels/categories`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
};
exports.fundWallet = async (amount) => {
  const res = await fetch(`${process.env.SHIPBUBBLE_BASE_URL}/shipping/wallet/fund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_TEST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  return res.json();
};


