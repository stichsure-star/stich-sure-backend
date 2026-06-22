const axios = require("axios");
const { Payment, Order, Designer, Shipment, Customer } = require("../models");
const { getShippingRates, validateAddress, getPackageCategories, trackShipment,createShipment, fundWallet} = require("../services/shipbubble.service");

const getCheapestCourier = (couriers) =>
  couriers.reduce((prev, curr) =>
    Number(prev.total) < Number(curr.total) ? prev : curr
  );

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};

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

exports.initializePayment  = async (req, res, next) => {
  try {
    const { orderId, email } = req.body;

    const foundOrder = await Order.findByPk(orderId);
    if (!foundOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const customer = await Customer.findByPk(foundOrder.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const designer = await Designer.findByPk(foundOrder.designerId);
    if (!designer) {
      return res.status(404).json({ success: false, message: "Designer not found" });
    }
console.log("Step 1: Order, customer and designer found");
const customerAddressResult = await validateAddress({
  name: `${customer.firstName} ${customer.lastName}`,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
});
console.log('customerAddressResult:', JSON.stringify(customerAddressResult, null, 2));

const designerAddressResult = await validateAddress({
  name: `${designer.firstName} ${designer.lastName}`,
  email: designer.email,
  phone: designer.phone,
  address: designer.address,
});
    console.log({
    customerPhone: customer.phone,
    customerAddress: customer.address,
    designerPhone: designer.phone,
    designerAddress: designer.address,
}); 
console.log({
  name: `${customer.firstName} ${customer.lastName}`,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
});
console.log('designerAddressResult:', JSON.stringify(designerAddressResult, null, 2));
if (customerAddressResult.status === "failed") {
  return res.status(400).json({
    success: false,
    message: customerAddressResult.message,
  });
}

if (designerAddressResult.status === "failed") {
  return res.status(400).json({
    success: false,
    message: designerAddressResult.message,
  });
}

const customerAddressCode = customerAddressResult.data.address_code;
const designerAddressCode = designerAddressResult.data.address_code;

    const pickup_date = getTomorrowDate();

   const packagePayload = (sender, receiver) => ({
  sender_address_code: sender,
  reciever_address_code: receiver,
  pickup_date,
  category_id: 74794423,
  package_items: [
    {
      name: "Order Package",
      description: "Fashion Item",
      unit_weight: "0.5",
      unit_amount: String(foundOrder.amount || 0),
      quantity: "1",
    },
  ],
  package_dimension: {
    length: 20,
    width: 15,
    height: 10,
  },
});
console.log(
  JSON.stringify(
    packagePayload(customerAddressCode, designerAddressCode),
    null,
    2
  )
);

 console.log("Step 2: Fetching pickup rates...");
    const pickupRates = await getShippingRates(
      packagePayload(customerAddressCode, designerAddressCode)
    );

    if (pickupRates.status === "failed" || !pickupRates.data?.couriers?.length) {
      return res.status(400).json({
        success: false,
        message: pickupRates.message || "No courier available for pickup",
      });
    }
console.log("Pickup Rates:", pickupRates);

console.log("Step 3: Fetching delivery rates...");
    const deliveryRates = await getShippingRates(
      packagePayload(designerAddressCode, customerAddressCode)
    );

    if (deliveryRates.status === "failed" || !deliveryRates.data?.couriers?.length) {
      return res.status(400).json({
        success: false,
        message: deliveryRates.message || "No courier available for delivery",
      });
    }
    console.log("Delivery Rates:", deliveryRates);
    const cheapestPickup = getCheapestCourier(pickupRates.data.couriers);
    const cheapestDelivery = getCheapestCourier(deliveryRates.data.couriers);

    const pickupFee = Number(cheapestPickup.total);
    const deliveryFee = Number(cheapestDelivery.total);
    const shippingFee = pickupFee + deliveryFee; 
    const orderAmount = Number(foundOrder.amount || 0);

    const totalAmount = orderAmount + shippingFee;

    console.log({ orderAmount, pickupFee, deliveryFee, shippingFee, totalAmount });

console.log("Step 4: Initializing payment...");
console.log({
  amount: totalAmount,
  email: customer.email,
  key: process.env.KORA_SECRET_KEY?.slice(0, 10) + "..."
});
    const paymentResponse = await axios.post(
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
      orderId: foundOrder.id,
      customerId: foundOrder.customerId,
      designerId: foundOrder.designerId,
      amount: totalAmount,
      shippingFee,
      currency: "NGN",
      paymentProvider: "korapay",
      transactionReference: paymentResponse.data.data.reference,
      status: "pending",

      pickupRequestToken: pickupRates.data.request_token,
      pickupCourierId: String(cheapestPickup.courier_id),
      pickupServiceCode: cheapestPickup.service_code,
      pickupFee,

      deliveryRequestToken: deliveryRates.data.request_token,
      deliveryCourierId: String(cheapestDelivery.courier_id),
      deliveryServiceCode: cheapestDelivery.service_code,
      deliveryFee,
    });

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      orderAmount,
      pickupFee,
      deliveryFee,
      shippingFee,
      totalAmount,
      checkoutUrl: paymentResponse.data.data.checkout_url,
      payment,
    });
  } catch (error) {
    console.log("Initialize Payment Error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Failed to initialize payment",
      success: false,
      error: error.response?.data || error.message,
    });
    console.log(error.response?.status);
console.log(error.response?.data);
  }
};

exports.verifyPayment =  async (req, res, next) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.KORA_SECRET_KEY}` } }
    );

    const paymentData = response.data.data;

    const payment = await Payment.findOne({ where: { transactionReference: reference } });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
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

    const pickupShipmentResult = await createShipment({
      request_token: payment.pickupRequestToken,
      courier_id: payment.pickupCourierId,
      service_code: payment.pickupServiceCode,
    });

    await payment.update({
      status: "success",
      paidAt: new Date(),
      pickupShipmentCreated: true,
    });

    await Order.update({ status: "paid" }, { where: { id: payment.orderId } });

    const courier = pickupShipmentResult.data?.courier;
    await Shipment.create({
      orderId: payment.orderId,
      type: "pickup",
      trackingCode: pickupShipmentResult.data?.order_id,
      trackingUrl: pickupShipmentResult.data?.tracking_url,
      courier: courier?.name,
      status: pickupShipmentResult.data?.status,
      shippingFee: pickupShipmentResult.data?.payment?.shipping_fee,
      currency: pickupShipmentResult.data?.payment?.currency,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and pickup shipment created successfully",
      payment,
      pickupShipment: pickupShipmentResult.data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Verification failed" });
  }
},
exports.createDeliveryShipment= async (req, res) => {
  try {
    const { orderId } = req.params;
    const designerId = req.user.id; 

    const foundOrder = await Order.findByPk(orderId);
    if (!foundOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

   
    if (foundOrder.designerId !== designerId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned designer can create the delivery shipment",
      });
    }

    const payment = await Payment.findOne({
      where: { orderId, status: "success" },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No successful payment found for this order",
      });
    }

    if (payment.deliveryShipmentCreated) {
      return res.status(400).json({
        success: false,
        message: "Delivery shipment has already been created for this order",
      });
    }

    const deliveryResult = await createShipment({
      request_token: payment.deliveryRequestToken,
      courier_id: payment.deliveryCourierId,
      service_code: payment.deliveryServiceCode,
    });

    console.log("createDeliveryShipment result:", JSON.stringify(deliveryResult, null, 2));

    if (deliveryResult.status === "failed") {
      return res.status(400).json({
        success: false,
        message: deliveryResult.message || "Failed to create delivery shipment",
      });
    }

    await payment.update({ deliveryShipmentCreated: true });

    const courier = deliveryResult.data?.courier;
    const shipment = await Shipment.create({
      orderId: payment.orderId,
      type: "delivery",
      trackingCode: deliveryResult.data?.order_id,
      trackingUrl: deliveryResult.data?.tracking_url,
      courier: courier?.name,
      status: deliveryResult.data?.status,
      shippingFee: deliveryResult.data?.payment?.shipping_fee,
      currency: deliveryResult.data?.payment?.currency,
    });

    return res.status(200).json({
      success: true,
      message: "Delivery shipment created successfully",
      shipment,
      data: deliveryResult.data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create delivery shipment",
    });
  }
},
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