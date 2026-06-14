const { Payment, Order, Customer } = require("../models");
const otpGenerator = require("otp-generator");
const axios = require("axios");
const crypto = require("crypto");
const { releaseOrderEscrowToDesigner } = require("../utils/escrow");

const secretKey = process.env.KORA_SECRET_KEY;

exports.initiatePayment = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { orderId } = req.params;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.customerId !== customerId) {
      return res.status(403).json({
        message: "You can only pay for your own order",
      });
    }

    const ref = otpGenerator.generate(12, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const reference = `STICHSURE-${ref}`;

    const paymentData = {
      amount: order.amount,
      currency: "NGN",
      reference,
      customer: {
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
      },
      redirect_url: "https://www.stichsure.com",
      notification_url: "webhook",
    };

    const { data } = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_API_KEY}`,
        },
      },
    );

    const payment = await Payment.create({
      amount: paymentData.amount,
      reference,
      customerId,
      designerId: order.designerId,
      orderId: order.id,
    });

    res.status(200).json({
      message: "Payment initialized successfully",
      data,
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.query;

    const { data } = await axios.get(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_API_KEY}`,
        },
      },
    );

    const payment = await Payment.findOne({ 
        where: { reference } 
    });
    if (!payment) {
      return res.status(404).json({ 
        message: "Payment not found" 
    });
}

    if (data?.status === true && data?.data?.status === "success") {
      payment.status = "success";
      await payment.save();
      const escrow = await releaseOrderEscrowToDesigner(payment.orderId);

      return res.status(200).json({
        message: "Payment verified successfully",
        data: data?.data,
        escrow,
      });
    } else {
      payment.status = data?.data?.status || "failed";
      await payment.save();

      return res.status(200).json({
        message: "Payment verification failed",
        data: payment,
      });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.verifyWebhook = async (req, res, next) => {
  try {
    const { event, data } = req.body;
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(JSON.stringify(data))
      .digest("hex");
    const signature = req.headers["x-korapay-signature"];

    if (hash !== signature) {
      return res.status(401).json({ 
        message: "Invalid webhook signature" 
    });
}

    const payment = await Payment.findOne({
      where: { reference: data.reference },
    });
    if (!payment) {
      return res.status(404).json({ 
        message: "Payment record not found" 
    });
}

    if (event === "charge.success") {
      payment.status = "success";
    } else if (event === "charge.pending") {
      payment.status = "pending";
    } else if (event === "charge.failed") {
      payment.status = "failed";
    }

    await payment.save();
    const escrow =
      payment.status === "success"
        ? await releaseOrderEscrowToDesigner(payment.orderId)
        : null;

    res.status(200).json({
      success: true,
      status: "successful",
      message: "Webhook processed successfully",
      escrow,
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
