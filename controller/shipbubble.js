const { getShippingRates, createShipment, trackShipment, validateAddress, getPackageCategories } = require('../services/shipbubble.service');
const { Shipment } = require('../models');
const { AppError } = require('../utils/errorHandler');

exports.fetchRates = async (req, res, next) => {
  try {
    const rates = await getShippingRates(req.body);
    res.json(rates);
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const result = await createShipment(req.body);
    const courier = result.data?.courier;

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
    next(err);
  }
};

exports.trackOrder = async (req, res, next) => {
    try{
        const { orderId } = req.params;
        const trackingInfo = await trackShipment(orderId);
        res.json(trackingInfo);
    }catch(error) {
        next(error);
    }
}

exports.validateAddress = async (req, res, next) => {
  try {
    const result = await validateAddress(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const result = await getPackageCategories();
    res.json(result);
  } catch (err) {
    next(err);
  }
};