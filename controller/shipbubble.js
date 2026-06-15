const axios = require("axios");
const { Payment, Order, Designer, Shipment, Customer } = require("../models");
const { getShippingRates, validateAddress, getPackageCategories, trackShipment,createShipment, fundWallet} = require("../services/shipbubble.service");

exports.validateAddress = async (req, res) => {
  try {
    const result = await validateAddress(req.body);
    res.json(result);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to validate address'
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await getPackageCategories();
    res.json(result);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to get categories'
    });
  }
};

exports.fetchRates = async (req, res) => {
  try {
    const result = await getShippingRates(req.body);
    res.json(result);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to get rates'
    });
  }
};


exports.createOrder = async (req, res) => {
  try {
    const result = await createShipment(req.body);
    console.log('createShipment result:', JSON.stringify(result, null, 2));

const courier = result.data?.courier;

const shipmentData = {
  orderId: result.data?.order_id,
  trackingCode: result.data?.order_id,
  trackingUrl: result.data?.tracking_url,
  courier: courier?.name,
  status: result.data?.status,
  shippingFee: result.data?.payment?.shipping_fee,
  currency: result.data?.payment?.currency,
};

console.log('Shipment data to save:', JSON.stringify(shipmentData, null, 2));

const shipment = await Shipment.create(shipmentData);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to create shipment'
    });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const trackingInfo = await trackShipment(orderId);
    res.json(trackingInfo);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to track order'
    });
  }
};

exports.initializePayment = async (req, res, next) => {
  try {
    const { orderId, email, deliveryAddress } = req.body;

    const foundOrder = await Order.findByPk(orderId);
    console.log('Order fields:', JSON.stringify(foundOrder, null, 2));
    if (!foundOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    const customer = await Customer.findByPk(foundOrder.customerId);
if (!customer) {
  return res.status(404).json({
    success: false,
    message: "Customer not found",
  });
}

    const designer = await Designer.findByPk(foundOrder.designerId);
    console.log('Designer fields:', JSON.stringify(designer, null, 2));
    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "Designer not found",
      });
    }
    console.log("Designer:", {
  id: designer.id,
  firstName: designer.firstName,
  email: designer.email,
  phone: designer.phone,
  address: designer.address,
});
    const senderResult = await validateAddress({
      name: `${designer.firstName} ${designer.lastName}`,
      email: designer.email,
      phone: designer.phone,
      address: designer.address,
    });
    console.log('senderResult:', JSON.stringify(senderResult, null, 2));
   const receiverResult = await validateAddress({
  name: `${customer.firstName} ${customer.lastName}`,
  email: customer.email,
  phone: customer.phone,
  address: deliveryAddress,
});
if (senderResult.status === 'failed') {
  return res.status(400).json({
    success: false,
    message: 'Sender address validation failed',
    error: senderResult.message,
  });
}

if (receiverResult.status === 'failed') {
  return res.status(400).json({
    success: false,
    message: 'Receiver address validation failed',
    error: receiverResult.message,
  });
}

    const rates = await getShippingRates({
      sender_address_code: senderResult.data.address_code,
      reciever_address_code: receiverResult.data.address_code,
      pickup_date: new Date().toISOString().split('T')[0],
      category_id: 74794423,
      package_items: [
        {
          name: "Order package",
          description: "Fashion item",
          unit_weight: "0.5",
          unit_amount: String(foundOrder.amount),
          quantity: "1",
        }
      ],
      package_dimension: {
        length: 20,
        width: 15,
        height: 10,
      }
    });
    console.log('rates:', JSON.stringify(rates, null, 2));
    const couriers = rates.data.couriers;
    const cheapestCourier = couriers.reduce((prev, curr) =>
      prev.total < curr.total ? prev : curr
    );
    const shippingFee = cheapestCourier.total;
    const totalAmount = Number(foundOrder.amount) + Number(shippingFee);

    const response = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      {
        amount: totalAmount,
        currency: "NGN",
        customer: { email },
        reference: `PAY_${Date.now()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const payment = await Payment.create({
      orderId,
      amount: totalAmount,
      shippingFee,
      currency: "NGN",
      paymentProvider: "korapay",
      transactionReference: response.data.data.reference,
      status: "pending",
      requestToken: rates.data.request_token,
      courierId: String(cheapestCourier.courier_id),
      serviceCode: cheapestCourier.service_code,
    });

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      checkoutUrl: response.data.data.checkout_url,
      payment,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to Initialize Payment'
    });
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    const payment = await Payment.findOne({
      where: { transactionReference: reference },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (payment.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
      });
    }

    if (paymentData.status !== "success") {
      await payment.update({ status: "failed" });
      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
        status: paymentData.status,
      });
    }

    const shipmentResult = await createShipment({
      request_token: payment.requestToken,
      courier_id: payment.courierId,
      service_code: payment.serviceCode,
    });

    await payment.update({ status: "success" });
    await Order.update(
      { status: "paid" },
      { where: { id: payment.orderId } }
    );

    const courier = shipmentResult.data?.courier;
    await Shipment.create({
      orderId: payment.orderId,
      trackingCode: courier?.tracking_code,
      trackingUrl: shipmentResult.data?.tracking_url,
      courier: courier?.name,
      status: shipmentResult.data?.status,
      shippingFee: shipmentResult.data?.payment?.shipping_fee,
      currency: shipmentResult.data?.payment?.currency,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and shipment created successfully",
      payment,
      shipment: shipmentResult.data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ 
      message: 'Verification failed'
    });
  }
};

exports.fundWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await fundWallet(amount);
    res.json(result);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Failed to fund wallet'
    });
  }
};