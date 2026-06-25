const axios = require("axios");
const crypto = require("crypto");
const { Payment, Order, Designer, Shipment, Customer, DesignerProfile } = require("../models");
const { handleTransferWebhook } = require("../utils/withdrawal");
const { getDesignerContactDetails, normalizePhoneNumber } = require("../utils/designerContact");
const { sanitizeAddressForShipbubble } = require("../utils/addressSanitizer");
const {
  getShippingRates,
  validateAddress,
  getPackageCategories,
  trackShipment,
  createShipment,
  fundWallet
} = require("../services/shipbubble.service");
const getCheapestCourier = (couriers) =>
  couriers.reduce((prev, curr) =>
    Number(prev.total) < Number(curr.total) ? prev : curr
  );

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};

const getKorapayWebhookSecret = () =>
  process.env.KORAPAY_WEBHOOK_SECRET ||
  process.env.KORA_WEBHOOK_SECRET ||
  "";

const safeTimingEqualHex = (aHex, bHex) => {
  if (!aHex || !bHex) return false;
  const a = Buffer.from(String(aHex), "utf8");
  const b = Buffer.from(String(bHex), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const processSuccessfulPayment = async (payment) => {
  if (payment.pickupShipmentCreated && payment.status === "success") {
    return { alreadyProcessed: true };
  }

  const pickupShipmentResult = await createShipment({
    request_token: payment.pickupRequestToken,
    courier_id: payment.pickupCourierId,
    service_code: payment.pickupServiceCode,
  });

  await payment.update({
    status: "success",
    paidAt: payment.paidAt || new Date(),
    pickupShipmentCreated: true,
  });

  const courier = pickupShipmentResult.data?.courier;
  await Shipment.findOrCreate({
    where: { orderId: payment.orderId, type: "pickup" },
    defaults: {
      orderId: payment.orderId,
      type: "pickup",
      trackingCode: pickupShipmentResult.data?.order_id,
      trackingUrl: pickupShipmentResult.data?.tracking_url,
      courier: courier?.name,
      status: pickupShipmentResult.data?.status,
      shippingFee: pickupShipmentResult.data?.payment?.shipping_fee,
      currency: pickupShipmentResult.data?.payment?.currency,
    },
  });

  return { alreadyProcessed: false, pickupShipmentResult };
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

    console.log(
      "createShipment result:",
      JSON.stringify(result, null, 2)
    );

    if (result.status === "failed") {
      return res.status(400).json({
        success: false,
        message: result.message,
        errors: result.errors || [],
      });
    }

    const courier = result.data?.courier;

   const shipmentData = {
  orderId: req.body.orderId,
  shipbubbleOrderId: result.data?.order_id, 
  trackingCode: result.data?.order_id,
  trackingUrl: result.data?.tracking_url,
  courier: courier?.name,
  status: result.data?.status,
  shippingFee: result.data?.payment?.shipping_fee,
  currency: result.data?.payment?.currency,
};

    console.log(
      "Shipment data to save:",
      JSON.stringify(shipmentData, null, 2)
    );

    const shipment = await Shipment.create(shipmentData);

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment,
      data: result.data,
    });

  } catch (error) {
    console.log(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create shipment",
      error: error.response?.data || error.message,
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
 
const designerProfile = await DesignerProfile.findOne({
  where: { designerId: foundOrder.designerId }
});

if (!designerProfile) {
  return res.status(404).json({
    success: false,
    message: "Designer profile not found. Please complete your profile setup.",
  });
}

const designerContact = getDesignerContactDetails(designerProfile, designer);

console.log('designerProfile details:', {
  id: designerProfile.id,
  designerId: designerProfile.designerId,
  phone: designerContact.phone,
  address: designerContact.address,
});

const normalizedDesignerPhone = designerContact.phone;
const normalizedDesignerAddress = designerContact.address;
const normalizedCustomerPhone = normalizePhoneNumber(customer.phone);
const normalizedCustomerAddress = String(customer.address || "").trim();
const cleanedDesignerAddress = sanitizeAddressForShipbubble(normalizedDesignerAddress);
const cleanedCustomerAddress = sanitizeAddressForShipbubble(normalizedCustomerAddress);

if (!normalizedDesignerPhone || !normalizedDesignerAddress) {
  return res.status(400).json({
    success: false,
    message: "Designer profile incomplete",
    missing: {
      phone: !normalizedDesignerPhone,
      address: !normalizedDesignerAddress,
    },
    action: "Please ask the designer to update their profile with phone and address before payment",
  });
}

if (!normalizedCustomerPhone || !normalizedCustomerAddress) {
  return res.status(400).json({
    success: false,
    message: "Customer profile incomplete",
    missing: {
      phone: !normalizedCustomerPhone,
      address: !normalizedCustomerAddress,
    },
    action: "Please ask the customer to update their profile with phone and address before payment",
  });
}

const fallbackAddress = cleanedCustomerAddress || cleanedDesignerAddress || normalizedCustomerAddress;

console.log("Step 1: Order, customer and designer found");

const designerAddressResult = await validateAddress({
  name: `${designer.firstName} ${designer.lastName}`,
  email: designer.email,
  phone: normalizedDesignerPhone,
  address: cleanedDesignerAddress || normalizedDesignerAddress,
});

const customerAddressResult = await validateAddress({
  name: `${customer.firstName} ${customer.lastName}`,
  email: customer.email,
  phone: normalizedCustomerPhone,
  address: cleanedCustomerAddress || fallbackAddress,
});
console.log('customerAddressResult:', JSON.stringify(customerAddressResult, null, 2));


    console.log({
    customerPhone: normalizedCustomerPhone,
    customerAddress: normalizedCustomerAddress,
    designerPhone: normalizedDesignerPhone,
    designerAddress: normalizedDesignerAddress,
}); 
console.log({
  name: `${customer.firstName} ${customer.lastName}`,
  email: customer.email,
  phone: normalizedCustomerPhone,
  address: normalizedCustomerAddress,
});
console.log('designerAddressResult:', JSON.stringify(designerAddressResult, null, 2));
const resolvedCustomerAddressResult = customerAddressResult.status === "failed"
  ? await validateAddress({
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: normalizedCustomerPhone,
      address: fallbackAddress,
    })
  : customerAddressResult;

if (resolvedCustomerAddressResult.status === "failed") {
  return res.status(400).json({
    success: false,
    message: resolvedCustomerAddressResult.message || customerAddressResult.message,
  });
}

if (designerAddressResult.status === "failed") {
  return res.status(400).json({
    success: false,
    message: designerAddressResult.message,
  });
}
 
const customerAddressCode = resolvedCustomerAddressResult.data.address_code;
const designerAddressCode = designerAddressResult.data.address_code;

    const pickup_date = getTomorrowDate();
console.log('pickup_date:', pickup_date);
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
 const payload = packagePayload(customerAddressCode, designerAddressCode);
console.log('pickup payload:', JSON.stringify(payload, null, 2));
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
   console.log("Step 4: Initializing payment...");

const reference = `PAY_${Date.now()}`;

const paymentResponse = await axios.post(
  "https://api.korapay.com/merchant/api/v1/charges/initialize",
  {
    amount: totalAmount,
    currency: "NGN",
    customer: { email },

    reference,

    redirect_url: "https://stich-sure-frontend.vercel.app/user/checkoutpayment",
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

  reference,
  transactionReference: reference,

  currency: "NGN",
  paymentProvider: "korapay",
  totalAmount: totalAmount,        
  designAmount: orderAmount,  
  status: "pending",
  escrowStatus: null,

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

  checkoutUrl: paymentResponse.data.data.checkout_url,

  payment: {
    id: payment.id,
    reference: payment.reference,
    transactionReference: payment.transactionReference,
    status: payment.status,
    escrowStatus: payment.escrowStatus,
    currency: payment.currency,
    paymentProvider: payment.paymentProvider,
  },

  charges: {
    orderAmount,
    pickupFee,
    deliveryFee,
    shippingFee,
    totalAmount,
  },

  pickup: {
    request_token: pickupRates.data.request_token,
    courier_id: cheapestPickup.courier_id,
    service_code: cheapestPickup.service_code,
    is_cod_label: cheapestPickup.is_cod_label ?? false,
  },
  
  
  delivery: {
    request_token: deliveryRates.data.request_token,
    courier_id: cheapestDelivery.courier_id,
    service_code: cheapestDelivery.service_code,
    is_cod_label: cheapestDelivery.is_cod_label ?? false,
  },
});
  } catch (error) {
    console.log("Initialize Payment Error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Failed to initialize payment",
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

const pickupDate =
  pickupShipmentResult.data?.pickup_date ||
  pickupShipmentResult.data?.scheduled_date ||
  getTomorrowDate();

await payment.update({
  status: "success",
  paidAt: new Date(),
  pickupShipmentCreated: true,
  pickupDate,
  escrowStatus: "holding",
});

await Order.update(
  {
    status: "paid",
    pickupDate,
  },
  {
    where: {
      id: payment.orderId,
    },
  }
);

const courier = pickupShipmentResult.data?.courier;

const shipment = await Shipment.create({
  orderId: payment.orderId,
  type: "pickup",
  trackingCode: pickupShipmentResult.data?.order_id,
  trackingUrl: pickupShipmentResult.data?.tracking_url,
  courier: courier?.name,
  status: pickupShipmentResult.data?.status,
  shippingFee: pickupShipmentResult.data?.payment?.shipping_fee,
  currency: pickupShipmentResult.data?.payment?.currency,
});

await payment.reload();

const order = await Order.findByPk(payment.orderId);

return res.status(200).json({
  success: true,
  message: "Payment verified successfully. Pickup has been scheduled.",

  order,

  payment,

  shipment,

  pickupDate,

  pickupShipment: pickupShipmentResult.data,
});
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Verification failed" });
  }
},

exports.korapayWebhook = async (req, res) => {
  try {
    const webhookSecret = getKorapayWebhookSecret();
    const signature = req.headers["x-korapay-signature"];
    if (!webhookSecret || !signature) {
      return res.status(200).json({ received: true });
    }

    const raw = req.rawBody ? req.rawBody.toString("utf8") : null;
    const payload = raw ? JSON.parse(raw) : req.body;
    const data = payload?.data;
    if (!data) {
      return res.status(200).json({ received: true });
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(data))
      .digest("hex");

    if (!safeTimingEqualHex(expected, signature)) {
      return res.status(200).json({ received: true });
    }

    const event = payload?.event;
    if (event === "transfer.success" || event === "transfer.failed") {
      await handleTransferWebhook(data, event);
      return res.status(200).json({ received: true });
    }

    const reference =
      data.reference ||
      data.transaction_reference ||
      data.transactionReference;

    if (!reference) {
      return res.status(200).json({ received: true });
    }
    await Order.update(
  {
    status: "active",
    pickupDate,
  },
  {
    where: {
      id: payment.orderId,
    },
  }
);
    const payment = await Payment.findOne({
      where: { transactionReference: reference },
    });
    if (!payment) {
      return res.status(200).json({ received: true });
    }

    if (data.status !== "success") {
      if (payment.status !== "failed") {
        await payment.update({ status: "failed" });
      }
      return res.status(200).json({ received: true });
    }

    if (payment.status === "success" && payment.pickupShipmentCreated) {
      return res.status(200).json({ received: true });
    }

    await processSuccessfulPayment(payment);
    return res.status(200).json({ 
      received: true 
    });
  } catch (error) {
    console.log("Korapay webhook error:", error.message);
    return res.status(500).json({ received: true });
  }
};
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
exports.releaseEscrow = async (req, res) => {

    try {

        const { paymentId } = req.params;

        const payment = await Payment.findByPk(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        if (payment.escrowStatus === "released") {
            return res.status(400).json({
                success: false,
                message: "Escrow already released"
            });
        }

        const platformFee = payment.amount * 0.1 ;

        const designerAmount = payment.amount - platformFee;


        await payment.update({
            escrowStatus: "released",
            releasedAt: new Date(),
            platformFee,
            designerAmount,
            releasedBy: "system"
        });

        return res.json({
            success: true,
            message: "Escrow released successfully",
            data: payment
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
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