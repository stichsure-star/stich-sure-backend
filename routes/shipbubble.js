
const express = require('express');
const router = express.Router();

const {
  validateAddress,
  getCategories,
  fetchRates,
  createOrder,
  trackOrder,
  initializePayment,
  verifyPayment,
} = require('../controller/shipbubble');

router.post('/validate-address', validateAddress);
router.get('/categories', getCategories);
router.post('/rates', fetchRates);
router.post('/shipment', createOrder);
router.get('/track/:orderId', trackOrder);
router.post('/payment/initialize', initializePayment);
router.get('/payment/verify/:reference', verifyPayment);

module.exports = router;