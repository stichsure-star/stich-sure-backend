const { Op } = require("sequelize");
const {
  Order,
  Customer,
  Designer,
  Designs,
  request,
  Payment,
  Shipment
} = require("../models");
const { createShipment } = require('../services/shipbubble.service');
const { AppError } = require('../utils/errorHandler');
const { releaseOrderEscrowToDesigner } = require("../utils/escrow");
const { parseMeasurementValue } = require("../utils/measurement");

const allowedStatuses = ["pending", "active", "delivered", "completed", "cancelled"];
const statusAliases = {
  new: "pending",
  preparing: "active",
  ready: "delivered",
  picked_up: "active",
  pickedUp: "active",
  "picked-up": "active",
  in_production: "active",
};


const triggerDeliveryShipment = async (orderId, designerId) => {
  try {
    const payment = await Payment.findOne({
      where: { orderId, status: "success" },
    });

    if (!payment) {
      console.log(`No successful payment found for order ${orderId}`);
      return { success: false, message: "No successful payment found" };
    }

    if (payment.deliveryShipmentCreated) {
      console.log(`Delivery shipment already created for order ${orderId}`);
      return { success: false, message: "Delivery shipment already created" };
    }

    if (!payment.deliveryRequestToken) {
      console.log(`No delivery request token for order ${orderId}`);
      return { success: false, message: "No delivery request token found" };
    }

    const deliveryResult = await createShipment({
      request_token: payment.deliveryRequestToken,
      courier_id: payment.deliveryCourierId,
      service_code: payment.deliveryServiceCode,
    });

    console.log("triggerDeliveryShipment result:", JSON.stringify(deliveryResult, null, 2));

    if (deliveryResult.status === "failed") {
      console.log(`Delivery shipment failed for order ${orderId}:`, deliveryResult.message);
      return { success: false, message: deliveryResult.message };
    }

    await payment.update({ deliveryShipmentCreated: true });
    const courier = deliveryResult.data?.courier;
    const shipment = await Shipment.create({
      orderId,
      type: "delivery",
      trackingCode: deliveryResult.data?.order_id,
      trackingUrl: deliveryResult.data?.tracking_url,
      courier: courier?.name,
      status: deliveryResult.data?.status,
      shippingFee: deliveryResult.data?.payment?.shipping_fee,
      currency: deliveryResult.data?.payment?.currency,
    });

    return {
      success: true,
      message: "Delivery shipment created successfully",
      shipment,
      data: deliveryResult.data,
       };
  } catch (error) {
    console.log("triggerDeliveryShipment error:", error.message);
    return { success: false, message: error.message };
  }
};
const generateOrderNumber = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `QI-${randomNumber}`;
};

// const getPagination = (query) => {
//   const page = Math.max(Number(query.page) || 1, 1);
//   const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
//   const offset = (page - 1) * limit;
//   return { page, limit, offset };
// };

const buildOrderWhere = (req) => {
  const where = {};

  if (req.query.id) where.id = req.query.id;
  if (req.query.designerId) where.designerId = req.query.designerId;
  if (req.query.customerId) where.customerId = req.query.customerId;

  if (req.query.status) {
    const requestedStatus = req.query.status.toLowerCase();
    where.status = statusAliases[requestedStatus] || requestedStatus;
  }

  if (req.query.search) {
    where[Op.or] = [
      { orderNumber: { [Op.like]: `%${req.query.search}%` } },
      { itemName: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  return where;
};

const buildPaymentInclude = (required = false) => ({
  model: Payment,
  as: "payment",
  required,
  where: { status: "success" },
  attributes: [
    "id",
    "status",
    "paidAt",
    "amount",
    "currency",
    "paymentProvider",
    "transactionReference",
    "reference",
    "escrowStatus",
    "pickupFee",
    "deliveryFee",
    "shippingFee",
    "totalAmount",
    "pickupRequestToken",
    "pickupCourierId",
    "pickupServiceCode",
    "deliveryRequestToken",
    "deliveryCourierId",
    "deliveryServiceCode",
    "checkoutUrl"
  ],
});
console.log('build', buildPaymentInclude);

exports.buildVerifiedPaymentInclude = buildPaymentInclude;

exports.createOrder = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { requestId, designerId, designId, itemName, amount, pickupDate } = req.body;

    if (!itemName || !amount) {
      return res.status(400).json({
        success: false,
        message: "itemName and amount are required",
      });
    }

    let foundRequest = null;
    if (requestId) {
      foundRequest = await request.findByPk(requestId);

      if (!foundRequest) {
        return res.status(404).json({
          success: false,
          message: "Request not found",
        });
      }

      if (foundRequest.customerId !== customerId) {
        return res.status(403).json({
          success: false,
          message: "You can only create an order from your own request",
        });
      }
    }

    const resolvedDesignerId = designerId || foundRequest?.designerId;
    if (!resolvedDesignerId) {
      return res.status(400).json({
        success: false,
        message: "designerId is required when requestId is not provided",
      });
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      requestId: requestId,
      customerId,
      designerId: resolvedDesignerId,
      designId: designId || null,
      itemName,
      amount,
      status: "pending",
      placedAt: new Date(),
      pickupDate: pickupDate || null,
    });

    const orderWithDetails = await Order.findByPk(order.id, {
      include: [
        {
          model: request,
          as: "request",
          attributes: ["id", "measurement"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designImage", "designTitle", "category"],
        },
      ],
    });

    const responseData = {
      ...(orderWithDetails?.toJSON?.() || {}),
      measurement: parseMeasurementValue(orderWithDetails?.request?.measurement),
      designImage: orderWithDetails?.design?.designImage || null,
    };

    return res.status(201).json({
      success: true,
      message: "Your order has been placed successfully!",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDesignerOrders = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    // const { page, limit, offset } = getPagination(req.query);
    const where = {
      designerId,
      ...buildOrderWhere(req),
    };

    const { rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildPaymentInclude(true),
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designTitle", "category", "designImage"],
        },
      ],
      order: [["placedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Your designer orders have been retrieved.",
      data: rows,
      // pagination: {
      //   totalItems: count,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      //   pageSize: limit,
      //   hasNextPage: page < Math.ceil(count / limit),
      //   hasPreviousPage: page > 1,
      // },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    // const { page, limit, offset } = getPagination(req.query);
    const where = {
      customerId,
      ...buildOrderWhere(req),
    };

    const { rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildPaymentInclude(true),
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designTitle", "category", "designImage"],
        },
      ],
      order: [["placedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Your order history has been retrieved.",
      data: rows,
      // pagination: {
      //   totalItems: count,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      //   pageSize: limit,
      //   hasNextPage: page < Math.ceil(count / limit),
      //   hasPreviousPage: page > 1,
      // },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      attributes: [
        'id', 'orderNumber', 'itemName', 'amount',
        'status', 'pickupDate', 'placedAt', 'activeAt',
        'deliveredAt', 'completedAt', 'createdAt', 'updatedAt',
      ],
      include: [
        buildPaymentInclude(false),
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email", "phone", "address"],
        },
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email", "phone", "address"],
        },
        {
          model: request,
          as: "request",
          attributes: ["id", "measurement"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designImage", "designTitle", "category"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const payment = order.payment;

    const responseData = {
      ...(order?.toJSON?.() || {}),
      measurement: parseMeasurementValue(order?.request?.measurement),
      designImage: order?.design?.designImage || null,

      payment: payment ? {
        id: payment.id,
        reference: payment.reference,
        transactionReference: payment.transactionReference,
        status: payment.status,
        escrowStatus: payment.escrowStatus,
        currency: payment.currency,
        paymentProvider: payment.paymentProvider,
        paidAt: payment.paidAt,
        charges: {
          orderAmount: order.amount,
          pickupFee: payment.pickupFee,
          deliveryFee: payment.deliveryFee,
          shippingFee: payment.shippingFee,
          totalAmount: payment.totalAmount,
        },
        pickup: {
          request_token: payment.pickupRequestToken,
          courier_id: payment.pickupCourierId,
          service_code: payment.pickupServiceCode,
        },
        delivery: {
          request_token: payment.deliveryRequestToken,
          courier_id: payment.deliveryCourierId,
          service_code: payment.deliveryServiceCode,
        },
      } : null,
    };

    return res.status(200).json({
      success: true,
      message: "Order details retrieved.",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDesignerOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const designerId = req.user.id;

    if (req.user.role !== "designer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only designers can fetch designer orders.",
      });
    }

    const order = await Order.findOne({
      where: { id, designerId },
      include: [
        buildPaymentInclude(false),
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: request,
          as: "request",
          attributes: ["id", "measurement", "inspirationalImage", "designImage", "description"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designImage", "designTitle", "category"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

   const payment = order.payment;

const responseData = {

  ...(order?.toJSON?.() || {}),
  measurement: parseMeasurementValue(order?.request?.measurement),
  designImage: order?.design?.designImage || null,

  payment: payment ? {
    id: payment.id,
    reference: payment.reference,
    transactionReference: payment.transactionReference,
    status: payment.status,
    escrowStatus: payment.escrowStatus,
    currency: payment.currency,
    paymentProvider: payment.paymentProvider,
    paidAt: payment.paidAt,
    charges: {
      orderAmount: order.amount,
      pickupFee: payment.pickupFee,
      deliveryFee: payment.deliveryFee,
      shippingFee: payment.shippingFee,
      totalAmount: payment.totalAmount,
    },
    pickup: {
      request_token: payment.pickupRequestToken,
      courier_id: payment.pickupCourierId,
      service_code: payment.pickupServiceCode,
    },
    delivery: {
      request_token: payment.deliveryRequestToken,
      courier_id: payment.deliveryCourierId,
      service_code: payment.deliveryServiceCode,
    },
  } : null,
};

    return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully.",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only customers can fetch customer orders.",
      });
    }

    const order = await Order.findOne({
      where: { id, customerId },
      include: [
        buildPaymentInclude(false),
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: request,
          as: "request",
          attributes: ["id", "designImage", "designTitle", "category"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designImage", "designTitle", "category"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or does not belong to you",
      });
    }

     const payment = order.payment;

const responseData = {

  ...(order?.toJSON?.() || {}),
  measurement: parseMeasurementValue(order?.request?.measurement),
  designImage: order?.design?.designImage || null,

  payment: payment ? {
    id: payment.id,
    reference: payment.reference,
    transactionReference: payment.transactionReference,
    status: payment.status,
    escrowStatus: payment.escrowStatus,
    currency: payment.currency,
    paymentProvider: payment.paymentProvider,
    paidAt: payment.paidAt,
    charges: {
      orderAmount: order.amount,
      pickupFee: payment.pickupFee,
      deliveryFee: payment.deliveryFee,
      shippingFee: payment.shippingFee,
      totalAmount: payment.totalAmount,
    },
    pickup: {
      request_token: payment.pickupRequestToken,
      courier_id: payment.pickupCourierId,
      service_code: payment.pickupServiceCode,
    },
    delivery: {
      request_token: payment.deliveryRequestToken,
      courier_id: payment.deliveryCourierId,
      service_code: payment.deliveryServiceCode,
    },
  } : null,
};
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedStatus = req.body.status;
    const status = statusAliases[requestedStatus] || requestedStatus;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be new, preparing, ready, completed, cancelled, picked_up, or delivered",
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.designerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned designer can update this order",
      });
    }

    const updateData = { status };

    if (status === "active" && !order.activeAt) updateData.activeAt = new Date();
    if (status === "delivered" && !order.deliveredAt) updateData.deliveredAt = new Date();
    if (status === "completed" && !order.completedAt) updateData.completedAt = new Date();

    await order.update(updateData);

    let escrow = null;
    let deliveryShipment = null;

    if (status === "completed") {
   
      deliveryShipment = await triggerDeliveryShipment(order.id, req.user.id);

     
      escrow = await releaseOrderEscrowToDesigner(order.id);

      await order.reload();
      await updateDesignerStatsFromOrders(order.designerId);
    }

    return res.status(200).json({
      success: true,
      message: "The order status has been updated.",
      data: order,
      escrow,
      deliveryShipment,
    });
  } catch (error) {
    next(error);
  }
};

const updateDesignerStatsFromOrders = async (designerId) => {
  const { DesignerProfile } = require("../models");

  const profile = await DesignerProfile.findOne({ where: { designerId } });
  if (!profile) return;

  const totalOrders = await Order.count({
    where: { designerId },
    distinct: true,
    include: [buildPaymentInclude(true)],
  });

  const completedOrders = await Order.count({
    where: { designerId, status: "completed" },
    distinct: true,
    include: [buildPaymentInclude(true)],
  });

  const reliabilityScore =
    totalOrders === 0 ? 100 : Math.round((completedOrders / totalOrders) * 100);

  await profile.update({ completedOrders, reliabilityScore });
};

exports.getAllOrders = async (req, res, next) => {
  try {
    // const { page, limit, offset } = getPagination(req.query);
    const where = buildOrderWhere(req);

    const { rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildPaymentInclude(false), 
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designTitle", "category", "designImage"],
        },
      ],
      order: [["placedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "List of all orders retrieved.",
      data: rows,
      // pagination: {
      //   totalItems: count,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      //   pageSize: limit,
      //   hasNextPage: page < Math.ceil(count / limit),
      //   hasPreviousPage: page > 1,
      // },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByDesignerAndCustomer = async (req, res, next) => {
  try {
    const { designerId, customerId } = req.params;
    // const { page, limit, offset } = getPagination(req.query);

    if (!designerId || !customerId) {
      return res.status(400).json({
        success: false,
        message: "Both designerId and customerId are required",
      });
    }

    const where = {
      designerId,
      customerId,
      ...buildOrderWhere(req),
    };

    const { rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildPaymentInclude(true), 
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designTitle", "category", "designImage"],
        },
      ],
      order: [["placedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Orders between the designer and customer have been retrieved.",
      data: rows,
      // pagination: {
      //   totalItems: count,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      //   pageSize: limit,
      //   hasNextPage: page < Math.ceil(count / limit),
      //   hasPreviousPage: page > 1,
      // },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByDesignerId = async (req, res, next) => {
  try {
    const { designerId } = req.params;
    // const { page, limit, offset } = getPagination(req.query);

    const { rows } = await Order.findAndCountAll({
      where: { designerId, ...buildOrderWhere(req) },
      distinct: true,
      include: [
        buildPaymentInclude(false),
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designTitle", "category", "designImage"],
        },
      ],
      order: [["placedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Orders for the designer retrieved.",
      data: rows,
      // pagination: {
      //   totalItems: count,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      //   pageSize: limit,
      //   hasNextPage: page < Math.ceil(count / limit),
      //   hasPreviousPage: page > 1,
      // },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByCustomerId = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    // const { page, limit, offset } = getPagination(req.query);

    const { rows } = await Order.findAndCountAll({
      where: { customerId, ...buildOrderWhere(req) },
      distinct: true,
      include: [
        buildPaymentInclude(false),
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designs,
          as: "design",
          attributes: ["id", "designTitle", "category", "designImage"],
        },
      ],
      order: [["placedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Orders for the customer retrieved.",
      data: rows,
      // pagination: {
      //   totalItems: count,
      //   totalPages: Math.ceil(count / limit),
      //   currentPage: page,
      //   pageSize: limit,
      //   hasNextPage: page < Math.ceil(count / limit),
      //   hasPreviousPage: page > 1,
      // },
    });
  } catch (error) {
    next(error);
  }
};