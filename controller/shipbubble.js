// controllers/shipping.controller.js
const { getShippingRates, createShipment, trackShipment, validateAddress, getPackageCategories } = require('../services/shipbubble.service');
const { Shipment } = require('../models');

exports.fetchRates = async (req, res) => {
  try {
    const rates = await getShippingRates(req.body);
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const result = await createShipment(req.body);
    const courier = result.data?.courier;

    // Persist to DB via Sequelize
    const shipment = await Shipment.create({
      orderId: result.data?.order_id,
      trackingCode: courier?.tracking_code,
      trackingUrl: result.data?.tracking_url,
      courier: courier?.name,
      status: result.data?.status,
      shippingFee: result.data?.payment?.shipping_fee,
      currency: result.data?.payment?.currency,
    });

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.trackOrder = async (req, res) => {
    try{
        const { orderId } = req.params;
        const trackingInfo = await trackShipment(orderId);
        res.json(trackingInfo);
    }catch(error) {
        return res.status(500).json({
            error: error.message
        })
    }
}

exports.validateAddress = async (req, res) => {
  try {
    const result = await validateAddress(req.body);
    res.json(result);
  } catch (err) {
   return res.status(500).json({ 
    error: err.message 
  });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await getPackageCategories();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};