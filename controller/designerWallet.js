const {
  DesignerWallet,
  DesignerWalletTransaction,
  DesignerProfile,
  Designer,
  Order,
} = require("../models");
const { AppError } = require('../utils/errorHandler');

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

exports.createDesignerWallet = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: "Bank name, account number, and account name are required.",
      });
    }

    const existingWallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: "A wallet already exists for this designer. Use update instead.",
      });
    }

    const wallet = await DesignerWallet.create({
      designerId,
      bankName,
      accountNumber,
      accountName,
      totalEarnings: 0,
      availableBalance: 0,
      withdrawn: 0,
    });

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    if (profile) {
      await profile.update({
        bankName,
        accountNumber,
        accountName,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Your wallet has been set up successfully.",
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDesignerWallet = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    await wallet.update({
      bankName: bankName || wallet.bankName,
      accountNumber: accountNumber || wallet.accountNumber,
      accountName: accountName || wallet.accountName,
    });

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    if (profile) {
      await profile.update({
        bankName: bankName || profile.bankName,
        accountNumber: accountNumber || profile.accountNumber,
        accountName: accountName || profile.accountName,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet details updated.",
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDesignerWallet = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet details retrieved.",
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const { page, limit, offset } = getPagination(req.query);

    const { count, rows } = await DesignerWalletTransaction.findAndCountAll({
      where: { designerId },
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["id", "orderNumber", "itemName"],
        },
      ],
      order: [["transactionDate", "DESC"]],
      limit,
      offset,
    });

    const data = rows.map((transaction) => {
      const plainTransaction = transaction.toJSON();
      const designer = plainTransaction.designer;
      const order = plainTransaction.order;

      return {
        id: plainTransaction.id,
        designerName: designer
          ? `${designer.firstName} ${designer.lastName}`
          : null,
        date: plainTransaction.transactionDate,
        orderId: order?.orderNumber || null,
        orderDbId: order?.id || null,
        itemName: order?.itemName || null,
        amount: plainTransaction.amount,
        status: plainTransaction.status,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Your transaction history is ready.",
      data,
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

exports.getAllWallets = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { count, rows } = await DesignerWallet.findAndCountAll({
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "List of wallets retrieved.",
      data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit },
    });
  } catch (error) {
    next(error);
  }
};
