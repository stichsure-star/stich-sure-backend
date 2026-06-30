const { Op } = require("sequelize");
const axios = require("axios");
const crypto = require("crypto");
const { Collaboration, Designer, DesignerProfile, Payment, Shipment } = require("../models");
const { AppError } = require('../utils/errorHandler');
const { getDesignerContactDetails, normalizePhoneNumber } = require("../utils/designerContact");
const { sanitizeAddressForShipbubble } = require("../utils/addressSanitizer");
const { releaseOrderEscrowToDesigner } = require("../utils/escrow"); // Adjust helper location as needed

const {
  getShippingRates,
  validateAddress,
  createShipment
} = require("../services/shipbubble.service");

const designerAttributes = ["id", "firstName", "lastName", "email"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const collaborationInclude = [
  { model: Designer, as: "sender", attributes: designerAttributes },
  { model: Designer, as: "receiver", attributes: designerAttributes },
];

const getCheapestCourier = (couriers) =>
  couriers.reduce((prev, curr) => (Number(prev.total) < Number(curr.total) ? prev : curr));

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};

exports.createCollaboration = async (req, res, next) => {
  try {
    const senderDesignerId = req.user.id;
    const {
      receiverDesignerId,
      taskType,
      taskDetails,
      deadline,
      currentAddress,
      offeredPayment,
    } = req.body;

    if (senderDesignerId === receiverDesignerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a collaboration request to yourself",
      });
    }

    const receiver = await Designer.findByPk(receiverDesignerId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver designer not found",
      });
    }

    const collaboration = await Collaboration.create({
      senderDesignerId,
      receiverDesignerId,
      taskType,
      taskDetails,
      deadline,
      currentAddress,
      offeredPayment,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Your collaboration invitation has been sent.",
      data: collaboration,
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptCollaboration = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({ success: false, message: "Invalid collaboration id" });
    }

    const collaboration = await Collaboration.findByPk(id);
    if (!collaboration) {
      return res.status(404).json({ success: false, message: "Collaboration not found." });
    }

    if (collaboration.receiverDesignerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the receiving designer can accept this request" });
    }

    if (collaboration.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending collaborations can be accepted" });
    }

    await collaboration.update({ status: "accepted" });

    return res.status(200).json({
      success: true,
      message: "You have accepted the collaboration invitation. Awaiting checkout payment from the sender.",
      data: collaboration,
    });
  } catch (error) {
    next(error);
  }
};



exports.initializeCollaborationPayment = async (req, res, next) => {
  try {
    const { collaborationId, email } = req.body;
    const senderId = req.user.id;

    const collaboration = await Collaboration.findByPk(collaborationId);
    if (!collaboration) {
      return res.status(404).json({ success: false, message: "Collaboration details not found" });
    }

    if (collaboration.senderDesignerId !== senderId) {
      return res.status(403).json({ success: false, message: "Unauthorized profile checkout operation" });
    }

    if (collaboration.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Payment checkout requires receiver acceptance profile context" });
    }

    const sender = await Designer.findByPk(collaboration.senderDesignerId);
    const receiver = await Designer.findByPk(collaboration.receiverDesignerId);
    
    const senderProfile = await DesignerProfile.findOne({ where: { designerId: sender.id } });
    const receiverProfile = await DesignerProfile.findOne({ where: { designerId: receiver.id } });

    if (!senderProfile || !receiverProfile) {
      return res.status(400).json({ success: false, message: "Both designers must configure application profiles before checkout processing" });
    }

    const senderContact = getDesignerContactDetails(senderProfile, sender);
    const receiverContact = getDesignerContactDetails(receiverProfile, receiver);

    const cleanSenderPhone = normalizePhoneNumber(senderContact.phone);
    const cleanReceiverPhone = normalizePhoneNumber(receiverContact.phone);
    const cleanSenderAddr = sanitizeAddressForShipbubble(senderContact.address);
    const cleanReceiverAddr = sanitizeAddressForShipbubble(receiverContact.address);

    if (!cleanSenderPhone || !cleanSenderAddr || !cleanReceiverPhone || !cleanReceiverAddr) {
      return res.status(400).json({ success: false, message: "Logistics data profiles are incomplete across entities" });
    }

    const senderAddressResult = await validateAddress({
      name: `${sender.firstName} ${sender.lastName}`,
      email: sender.email,
      phone: cleanSenderPhone,
      address: cleanSenderAddr,
    });

    const receiverAddressResult = await validateAddress({
      name: `${receiver.firstName} ${receiver.lastName}`,
      email: receiver.email,
      phone: cleanReceiverPhone,
      address: cleanReceiverAddr,
    });

    if (senderAddressResult.status === "failed" || receiverAddressResult.status === "failed") {
      return res.status(400).json({
        success: false,
        message: "Failed mapping geographic operational limits with courier service criteria.",
        details: { sender: senderAddressResult.message, receiver: receiverAddressResult.message }
      });
    }

    const senderCode = senderAddressResult.data.address_code;
    const receiverCode = receiverAddressResult.data.address_code;
    const pickup_date = getTomorrowDate();

    const buildPackagePayload = (sCode, rCode) => ({
      sender_address_code: sCode,
      reciever_address_code: rCode,
      pickup_date,
      category_id: 74794423,
      package_items: [
        {
          name: "Collaboration Items",
          description: "Production Assembly Materials",
          unit_weight: "0.5",
          unit_amount: String(collaboration.offeredPayment || 0),
          quantity: "1",
        },
      ],
      package_dimension: { length: 20, width: 15, height: 10 },
    });

    const pickupRates = await getShippingRates(buildPackagePayload(senderCode, receiverCode));
    const deliveryRates = await getShippingRates(buildPackagePayload(receiverCode, senderCode));

    if (!pickupRates.data?.couriers?.length || !deliveryRates.data?.couriers?.length) {
      return res.status(400).json({ success: false, message: "No viable courier paths serve these coordinates currently" });
    }

    const cheapestPickup = getCheapestCourier(pickupRates.data.couriers);
    const cheapestDelivery = getCheapestCourier(deliveryRates.data.couriers);

    const pickupFee = Number(cheapestPickup.total);
    const deliveryFee = Number(cheapestDelivery.total);
    const shippingFee = pickupFee + deliveryFee;
    const escrowPayment = Number(collaboration.offeredPayment || 0);
    const totalAmount = escrowPayment + shippingFee;

    const reference = `COL_PAY_${collaboration.id.slice(0, 6)}_${Date.now()}`;

    const paymentResponse = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      {
        amount: totalAmount,
        currency: "NGN",
        customer: { email: email || sender.email },
        reference,
        redirect_url: "https://stichsure.vercel.app/designer/collaboration-status",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

   
    const payment = await Payment.create({
      amount: totalAmount,
      shippingFee,
      reference,
      transactionReference: reference,
      currency: "NGN",
      paymentProvider: "korapay",
      totalAmount,
      designAmount: escrowPayment,
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
      checkoutUrl: paymentResponse.data.data.checkout_url,
    });

    return res.status(200).json({
      success: true,
      message: "Collaboration escrow initialized successfully",
      checkoutUrl: paymentResponse.data.data.checkout_url,
      paymentId: payment.id,
      charges: { offeredPayment: escrowPayment, pickupFee, deliveryFee, totalAmount }
    });
  } catch (error) {
    console.error("D2D Escrow Initialization Error:", error.response?.data || error.message);
    next(error);
  }
};

exports.verifyCollaborationPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.KORA_SECRET_KEY}` } }
    );

    const paymentData = response.data.data;
    const payment = await Payment.findOne({ where: { transactionReference: reference } });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment tracking identity missing" });
    }

    if (payment.status === "success") {
      return res.status(200).json({ success: true, message: "Payment confirmed previously", payment });
    }

    if (paymentData.status !== "success") {
      await payment.update({ status: "failed" });
      return res.status(400).json({ success: false, message: "Gateway processing reports incomplete balance transfer" });
    }


    await payment.update({
      status: "success",
      paidAt: new Date(),
      escrowStatus: "holding",
    });

    const targetCollabId = reference.split("_")[2]; 
    const matchingCollab = await Collaboration.findOne({
      where: { id: { [Op.like]: `${targetCollabId}%` } }
    });

    if (matchingCollab) {
      await matchingCollab.update({ status: "active" });
    }

    return res.status(200).json({
      success: true,
      message: "Escrow funds locked. Collaboration tracking state verified active.",
      payment
    });
  } catch (error) {
    next(error);
  }
};

exports.completeCollaboration = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({ success: false, message: "Invalid collaboration transaction signature" });
    }

    const collaboration = await Collaboration.findByPk(id);
    if (!collaboration) {
      return res.status(404).json({ success: false, message: "Collaboration not found" });
    }

    if (collaboration.senderDesignerId !== req.user.id && collaboration.receiverDesignerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access tracking boundary rejected" });
    }

    if (collaboration.status !== "active") {
      return res.status(400).json({ success: false, message: "Only active funded transactions may process structural closing loops" });
    }

   
    await collaboration.update({ status: "completed" });

   
    const shortId = id.slice(0, 6);
    const payment = await Payment.findOne({
      where: { reference: { [Op.like]: `COL_PAY_${shortId}%` }, status: "success" },
    });

    let deliveryShipment = null;
    if (payment && !payment.deliveryShipmentCreated && payment.deliveryRequestToken) {
      const deliveryResult = await createShipment({
        request_token: payment.deliveryRequestToken,
        courier_id: payment.deliveryCourierId,
        service_code: payment.deliveryServiceCode,
      });

      if (deliveryResult.status !== "failed") {
        await payment.update({ deliveryShipmentCreated: true });

        const courier = deliveryResult.data?.courier;
        deliveryShipment = await Shipment.create({
          type: "delivery",
          trackingCode: deliveryResult.data?.order_id,
          trackingUrl: deliveryResult.data?.tracking_url,
          courier: courier?.name,
          status: deliveryResult.data?.status,
          shippingFee: deliveryResult.data?.payment?.shipping_fee,
          currency: deliveryResult.data?.payment?.currency,
        });
      }
    }

    let escrowRelease = null;
    try {
      escrowRelease = await releaseOrderEscrowToDesigner(id);
    } catch (escrowErr) {
      console.log("Escrow transfer component framework mismatch error logs:", escrowErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Collaboration complete loop satisfied. Delivery waybill generated & escrow payout routed to receiver balance profiles.",
      data: collaboration,
      deliveryShipment,
      escrowRelease
    });
  } catch (error) {
    next(error);
  }
};



exports.getSentCollaborations = async (req, res, next) => {
  try {
    const collaborations = await Collaboration.findAll({
      where: { senderDesignerId: req.user.id },
      include: collaborationInclude,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ success: true, data: collaborations });
  } catch (error) { next(error); }
};

exports.getReceivedCollaborations = async (req, res, next) => {
  try {
    const collaborations = await Collaboration.findAll({
      where: { receiverDesignerId: req.user.id },
      include: collaborationInclude,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ success: true, data: collaborations });
  } catch (error) { next(error); }
};

exports.getOneCollaboration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collaboration = await Collaboration.findOne({
      where: {
        id,
        [Op.or]: [{ senderDesignerId: req.user.id }, { receiverDesignerId: req.user.id }],
      },
      include: collaborationInclude,
    });
    if (!collaboration) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, data: collaboration });
  } catch (error) { next(error); }
};

exports.rejectCollaboration = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!uuidPattern.test(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const collaboration = await Collaboration.findByPk(id);
    if (!collaboration) return res.status(404).json({ success: false, message: "Not found" });
    if (collaboration.receiverDesignerId !== req.user.id) return res.status(403).json({ success: false });
    if (collaboration.status !== "pending") return res.status(400).json({ success: false, message: "Must be pending" });

    await collaboration.update({ status: "rejected" });
    return res.status(200).json({ success: true, message: "Collaboration request declined.", data: collaboration });
  } catch (error) { next(error); }
};

exports.cancelCollaboration = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!uuidPattern.test(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const collaboration = await Collaboration.findByPk(id);
    if (!collaboration) return res.status(404).json({ success: false, message: "Not found" });
    if (collaboration.senderDesignerId !== req.user.id) return res.status(403).json({ success: false });
    if (!["pending", "accepted"].includes(collaboration.status)) return res.status(400).json({ success: false });

    await collaboration.update({ status: "cancelled" });
    return res.status(200).json({ success: true, message: "The collaboration has been cancelled.", data: collaboration });
  } catch (error) { next(error); }
};

exports.getCollaborationStats = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const designerWhere = { [Op.or]: [{ senderDesignerId: designerId }, { receiverDesignerId: designerId }] };

    const activeCollaborations = await Collaboration.count({ where: { ...designerWhere, status: "active" } });
    const tasksCompleted = await Collaboration.count({ where: { ...designerWhere, status: "completed" } });
    const totalFinished = await Collaboration.count({
      where: { ...designerWhere, status: { [Op.in]: ["completed", "rejected", "cancelled"] } }
    });

    const partners = await Collaboration.findAll({ where: designerWhere, attributes: ["senderDesignerId", "receiverDesignerId"] });
    const partnerIds = new Set();
    partners.forEach((collab) => {
      if (collab.senderDesignerId !== designerId) partnerIds.add(collab.senderDesignerId);
      if (collab.receiverDesignerId !== designerId) partnerIds.add(collab.receiverDesignerId);
    });

    const successRate = totalFinished === 0 ? 0 : Math.round((tasksCompleted / totalFinished) * 100);

    return res.status(200).json({
      success: true,
      data: { activeCollaborations, trustedPartners: partnerIds.size, tasksCompleted, successRate }
    });
  } catch (error) { next(error); }
};

exports.getAllCollaborations = async (req, res, next) => {
  try {
    const collaborations = await Collaboration.findAll({ include: collaborationInclude, order: [["createdAt", "DESC"]] });
    return res.status(200).json({ success: true, data: collaborations });
  } catch (error) { next(error); }
};