
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
  korapayWebhook,
  fundWallet
} = require('../controller/shipbubble');
const {
  validateAddressValidator,
  shippingRatesValidator,
  createShipmentValidator,
  initializeShipmentPaymentValidator,
} = require('../middlewares/bodyValidation');

router.post('/validate-address', validateAddressValidator, validateAddress);
router.get('/categories', getCategories);
router.post('/rates', shippingRatesValidator, fetchRates);
router.post('/shipment', createShipmentValidator, createOrder);
router.get('/track/:orderId', trackOrder);
router.post('/payment/initialize', initializeShipmentPaymentValidator, initializePayment);
router.get('/payment/verify/:reference', verifyPayment);
router.post('/payment/webhook', korapayWebhook);
router.post('/wallet/fund', fundWallet);

module.exports = router;
