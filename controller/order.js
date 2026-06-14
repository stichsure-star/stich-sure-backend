const { Op } = require("sequelize");
const {
  Order,
  Customer,
  Designer,
  Designs,
  request,
} = require("../models");
const { AppError } = require('../utils/errorHandler');
const { releaseOrderEscrowToDesigner } = require("../utils/escrow");

const allowedStatuses = ["new", "preparing", "ready", "completed", "cancelled"];
const statusAliases = {
  picked_up: "preparing",
  pickedUp: "preparing",
  "picked-up": "preparing",
  in_production: "preparing",
  delivered: "completed",
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

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.search) {
    where[Op.or] = [
      { orderNumber: { [Op.like]: `%${req.query.search}%` } },
      { itemName: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  return where;
};

exports.createOrder = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { requestId, designerId, designId, itemName, amount, address } = req.body;

    if (!itemName || !amount || !address) {
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
      requestId: requestId || null,
      customerId,
      designerId: resolvedDesignerId,
      designId: designId || null,
      itemName,
      amount,
      address,
      status: "new",
      placedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: order,
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
      include: [
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
      message: "Designer orders loaded successfully.",
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
      include: [
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
      message: "Customer orders loaded successfully.",
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
      include: [
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
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order loaded successfully.",
      data: order,
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

    if (status === "preparing" && !order.preparingAt) {
      updateData.preparingAt = new Date();
    }

    if (status === "ready" && !order.readyAt) {
      updateData.readyAt = new Date();
    }

    if (status === "completed" && !order.completedAt) {
      updateData.completedAt = new Date();
    }

    await order.update(updateData);

    let escrow = null;
    if (status === "completed") {
      escrow = await releaseOrderEscrowToDesigner(order.id);
      await order.reload();
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: order,
      escrow,
    });
  } catch (error) {
    next(error);
  }
};
