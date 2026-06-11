const {
  DesignerWallet,
  DesignerWalletTransaction,
  Designer,
  Order,
} = require("../models");

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

exports.createDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

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

    return res.status(201).json({
      success: true,
      message: "Wallet created successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.updateDesignerWallet = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      message: "Wallet updated successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getDesignerWallet = async (req, res) => {
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
      message: "Designer wallet loaded successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getTransactionHistory = async (req, res) => {
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
      message: "Transaction history loaded successfully.",
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
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
