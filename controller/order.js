const { Op } = require("sequelize");
const {
  Order,
  Customer,
  Designer,
  Designs,
  request,
  Payment
} = require("../models");
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

const generateOrderNumber = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `QI-${randomNumber}`;
};

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildOrderWhere = (req) => {
  const where = {};

  if (req.query.id) {
    where.id = req.query.id;
  }

  if (req.query.designerId) {
    where.designerId = req.query.designerId;
  }

  if (req.query.customerId) {
    where.customerId = req.query.customerId;
  }

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

const buildVerifiedPaymentInclude = () => ({
  model: Payment,
  as: "payment",
  required: true,
  where: { status: "success" },
  attributes: [
    "id",
    "status",
    "paidAt",
    "amount",
    "currency",
    "paymentProvider",
    "transactionReference",
  ],
});

exports.buildVerifiedPaymentInclude = buildVerifiedPaymentInclude;

exports.createOrder = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { requestId, designerId, designId, itemName, amount, pickupDate } = req.body;
    if (!itemName || !amount ) {
      return res.status(400).json({
        success: false,
        message: "itemName, amount, and address are required",
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
    const { page, limit, offset } = getPagination(req.query);
    const where = {
      designerId,
      ...buildOrderWhere(req),
    };

    const { count, rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildVerifiedPaymentInclude(),
        {
           model: Payment,
          as: "payment",
          required: true,        
          where: { status: "success" },
          attributes: [
            "id", "status", "paidAt", "amount",
            "currency", "paymentProvider", "transactionReference",
          ],
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
      limit,
      offset,
    });

     return res.status(200).json({
      success: true,
      message: "Your designer orders have been retrieved.",
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { page, limit, offset } = getPagination(req.query);
    const where = {
      customerId,
      ...buildOrderWhere(req),
    };

    const { count, rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        {
          model: Payment,
          as: "payment",
          required: true,       
          where: { status: "success" },
          attributes: [
            "id", "status", "paidAt", "amount",
            "currency", "paymentProvider", "transactionReference",
          ],
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
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Your order history has been retrieved.",
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
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
        'id',
        'orderNumber',
        'itemName',
        'amount',
        'status',  
        'pickupDate',    
        'placedAt',
        'activeAt',
        'deliveredAt',
        'completedAt',
        'createdAt',
        'updatedAt',
      ],
      include: [
        buildVerifiedPaymentInclude(),
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

    const responseData = {
      ...(order?.toJSON?.() || {}),
      measurement: parseMeasurementValue(order?.request?.measurement),
      designImage: order?.design?.designImage || null,
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
        buildVerifiedPaymentInclude(),
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
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
        message: "Order not found or not assigned to you",
      });
    }

    const responseData = {
      ...(order?.toJSON?.() || {}),
      measurement: parseMeasurementValue(order?.request?.measurement),
      designImage: order?.design?.designImage || null,
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
        buildVerifiedPaymentInclude(),
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
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
        message: "Order not found or does not belong to you",
      });
    }

    const responseData = {
      ...(order?.toJSON?.() || {}),
      measurement: parseMeasurementValue(order?.request?.measurement),
      designImage: order?.design?.designImage || null,
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
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.designerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned designer can update this order",
      });
    }

    const updateData = { status };

    if (status === "active" && !order.activeAt) {
      updateData.activeAt = new Date();
    }

    if (status === "delivered" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    if (status === "completed" && !order.completedAt) {
      updateData.completedAt = new Date();
    }

    await order.update(updateData);

    let escrow = null;
    if (status === "completed") {
      escrow = await releaseOrderEscrowToDesigner(order.id);
      await order.reload();
      await updateDesignerStatsFromOrders(order.designerId);
    }

    return res.status(200).json({
      success: true,
      message: "The order status has been updated.",
      data: order,
      escrow,
    });
  } catch (error) {
    next(error);
  }
};

const updateDesignerStatsFromOrders = async (designerId) => {
  const { DesignerProfile, Order, Op } = require("../models");

  const profile = await DesignerProfile.findOne({
    where: { designerId },
  });

  if (!profile) {
    return;
  }

  const totalOrders = await Order.count({
    where: { designerId },
    distinct: true,
    include: [buildVerifiedPaymentInclude()],
  });

  const completedOrders = await Order.count({
    where: {
      designerId,
      status: "completed",
    },
    distinct: true,
    include: [buildVerifiedPaymentInclude()],
  });

  const reliabilityScore =
    totalOrders === 0
      ? 100
      : Math.round((completedOrders / totalOrders) * 100);

  await profile.update({
    completedOrders,
    reliabilityScore,
  });
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = buildOrderWhere(req);

    const { count, rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildVerifiedPaymentInclude(),
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
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "List of all orders retrieved.",
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getOrdersByDesignerAndCustomer = async (req, res, next) => {
  try {
    const { designerId, customerId } = req.params;
    const { page, limit, offset } = getPagination(req.query);

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

    const { count, rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      include: [
        buildVerifiedPaymentInclude(),
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
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Orders between the designer and customer have been retrieved.",
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByDesignerId = async (req, res, next) => {
  try {
    const { designerId } = req.params;
    const { page, limit, offset } = getPagination(req.query);

    const { count, rows } = await Order.findAndCountAll({
      where: { designerId, ...buildOrderWhere(req) },
      distinct: true,
      include: [
        buildVerifiedPaymentInclude(),
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
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Orders for the designer retrieved.",
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByCustomerId = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { page, limit, offset } = getPagination(req.query);

    const { count, rows } = await Order.findAndCountAll({
      where: { customerId, ...buildOrderWhere(req) },
      distinct: true,
      include: [
        buildVerifiedPaymentInclude(),
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
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Orders for the customer retrieved.",
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};