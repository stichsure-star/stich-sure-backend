const axios = require("axios");
const { Payment } = require("../models");

const initializePayment = async (req, res, next) => {
  try {
    const {
      orderId,
      email,
      amount
    } = req.body;

    const response = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      {
        amount,
        currency: "NGN",
        customer: {
          email
        },
        reference: `PAY_${Date.now()}`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const payment = await Payment.create({
      orderId,
      amount,
      currency: "NGN",
      paymentProvider: "korapay",
      transactionReference: response.data.data.reference,
      status: "pending"
    });

    return res.status(200).json({
      success: true,
      checkoutUrl: response.data.data.checkout_url,
      payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initializePayment
};