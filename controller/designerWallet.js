const {
  sequelize,
  DesignerWallet,
  DesignerWalletTransaction,
  DesignerProfile,
  Designer,
  Order,
} = require("../models");
const { AppError } = require('../utils/errorHandler');
const {
  getBanks,
  resolveWalletBankDetails,
  initiateBankPayout,
  getKoraSecretKey,
} = require("../services/korapay.service");
const {
  WITHDRAWAL_PLATFORM_FEE,
  generateWithdrawalReference,
  rollbackFailedWithdrawal,
} = require("../utils/withdrawal");

// const getPagination = (query) => {
//   const page = Math.max(Number(query.page) || 1, 1);
//   const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
//   const offset = (page - 1) * limit;

//   return { page, limit, offset };
// };

exports.createDesignerWallet = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const { bankName, bankCode, accountNumber, accountName } = req.body;

    if (!bankName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Bank name and account number are required.",
      });
    }

    if (!getKoraSecretKey()) {
      return res.status(500).json({
        success: false,
        message: "Korapay secret key is not configured.",
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

    let resolvedBankDetails;
    try {
      resolvedBankDetails = await resolveWalletBankDetails({
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const wallet = await DesignerWallet.create({
      designerId,
      bankName: resolvedBankDetails.bankName,
      bankCode: resolvedBankDetails.bankCode,
      accountNumber: resolvedBankDetails.accountNumber,
      accountName: resolvedBankDetails.accountName,
      totalEarnings: 0,
      availableBalance: 0,
      withdrawn: 0,
    });

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    if (profile) {
      await profile.update({
        bankName: resolvedBankDetails.bankName,
        accountNumber: resolvedBankDetails.accountNumber,
        accountName: resolvedBankDetails.accountName,
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
    const { bankName, bankCode, accountNumber, accountName } = req.body;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    const nextBankName = bankName || wallet.bankName;
    const nextBankCode = bankCode || wallet.bankCode;
    const nextAccountNumber = accountNumber || wallet.accountNumber;
    const nextAccountName = accountName || wallet.accountName;
    const bankDetailsChanged =
      bankName ||
      bankCode ||
      accountNumber ||
      !wallet.bankCode ||
      !wallet.accountName;

    let resolvedBankDetails = {
      bankName: nextBankName,
      bankCode: nextBankCode,
      accountNumber: nextAccountNumber,
      accountName: nextAccountName,
    };

    if (bankDetailsChanged && getKoraSecretKey()) {
      try {
        resolvedBankDetails = await resolveWalletBankDetails({
          bankName: nextBankName,
          bankCode: nextBankCode,
          accountNumber: nextAccountNumber,
          accountName: nextAccountName,
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    await wallet.update({
      bankName: resolvedBankDetails.bankName,
      bankCode: resolvedBankDetails.bankCode,
      accountNumber: resolvedBankDetails.accountNumber,
      accountName: resolvedBankDetails.accountName,
    });

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    if (profile) {
      await profile.update({
        bankName: resolvedBankDetails.bankName,
        accountNumber: resolvedBankDetails.accountNumber,
        accountName: resolvedBankDetails.accountName,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet details updated.",
      data: wallet,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
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
    // const { page, limit, offset } = getPagination(req.query);

    const { rows } = await DesignerWalletTransaction.findAndCountAll({
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
        transactionType: plainTransaction.transactionType,
        payoutReference: plainTransaction.payoutReference || null,
        orderId: order?.orderNumber || null,
        orderDbId: order?.id || null,
        itemName:
          plainTransaction.transactionType === "withdrawal"
            ? "Wallet withdrawal"
            : order?.itemName || null,
        amount: plainTransaction.amount,
        status: plainTransaction.status,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Your transaction history is ready.",
      data,
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

exports.getAllWallets = async (req, res, next) => {
  try {
    // const { page, limit, offset } = getPagination(req.query);
    const { rows } = await DesignerWallet.findAndCountAll({
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "List of wallets retrieved.",
      data: rows,
      // pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBanks = async (req, res, next) => {
  try {
    if (!getKoraSecretKey()) {
      return res.status(500).json({
        success: false,
        message: "Korapay secret key is not configured.",
      });
    }

    const result = await getBanks(req.query.countryCode || "NG");

    return res.status(200).json({
      success: true,
      message: "Banks retrieved successfully.",
      data: result.data || [],
    });
  } catch (error) {
    next(error);
  }
};

exports.resolveBankAccountDetails = async (req, res, next) => {
  try {
    if (!getKoraSecretKey()) {
      return res.status(500).json({
        success: false,
        message: "Korapay secret key is not configured.",
      });
    }

    const { bankName, bankCode, accountNumber } = req.body;

    let resolvedBankDetails;
    try {
      resolvedBankDetails = await resolveWalletBankDetails({
        bankName,
        bankCode,
        accountNumber,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank account resolved successfully.",
      data: {
        bankName: resolvedBankDetails.bankName,
        bankCode: resolvedBankDetails.bankCode,
        accountNumber: resolvedBankDetails.accountNumber,
        accountName: resolvedBankDetails.accountName,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.withdrawFunds = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const withdrawAmount = Number(req.body.amount);
    const fee = WITHDRAWAL_PLATFORM_FEE;
    const netReceiveAmount = withdrawAmount - fee;

    if (req.user.role !== "designer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only designers can withdraw funds.",
      });
    }

    if (!getKoraSecretKey()) {
      return res.status(500).json({
        success: false,
        message: "Korapay secret key is not configured.",
      });
    }

    if (withdrawAmount <= fee) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be greater than the platform fee of NGN ${fee}.`,
      });
    }

    const designer = await Designer.findByPk(designerId);
    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "Designer not found",
      });
    }

    const payoutReference = generateWithdrawalReference(designerId);
    let walletSnapshot = null;
    let walletTransaction = null;

    await sequelize.transaction(async (dbTransaction) => {
      const wallet = await DesignerWallet.findOne({
        where: { designerId },
        transaction: dbTransaction,
        lock: dbTransaction.LOCK.UPDATE,
      });

      if (!wallet) {
        throw new AppError("Designer wallet not found. Please set up your wallet first.", 404);
      }

      if (!wallet.bankCode || !wallet.accountNumber || !wallet.accountName) {
        throw new AppError(
          "Please update your bank code, account number, and account name before withdrawing.",
          400
        );
      }

      const availableBalance = Number(wallet.availableBalance || 0);
      if (availableBalance < withdrawAmount) {
        throw new AppError(
          "Insufficient funds. Available balance is lower than the requested withdrawal amount.",
          400
        );
      }

      await wallet.update(
        {
          availableBalance: availableBalance - withdrawAmount,
          withdrawn: Number(wallet.withdrawn || 0) + withdrawAmount,
        },
        { transaction: dbTransaction }
      );

      walletTransaction = await DesignerWalletTransaction.create(
        {
          designerWalletId: wallet.id,
          designerId,
          orderId: null,
          transactionType: "withdrawal",
          payoutReference,
          amount: -withdrawAmount,
          status: "pending",
          transactionDate: new Date(),
        },
        { transaction: dbTransaction }
      );

      walletSnapshot = wallet;
    });

    try {
      const payoutResult = await initiateBankPayout({
        reference: payoutReference,
        amount: netReceiveAmount,
        bankCode: walletSnapshot.bankCode,
        accountNumber: walletSnapshot.accountNumber,
        customerName: walletSnapshot.accountName,
        customerEmail: designer.email,
        narration: "StitchSure designer withdrawal",
      });

      if (!payoutResult?.status) {
        await rollbackFailedWithdrawal(walletTransaction);
        return res.status(400).json({
          success: false,
          message: payoutResult?.message || "Withdrawal could not be initiated.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Withdrawal initiated successfully. Funds will be sent to your bank account shortly.",
        data: {
          withdrawalAmount: withdrawAmount,
          fee,
          netReceiveAmount,
          payoutReference,
          payoutStatus: payoutResult.data?.status || "processing",
          transaction: walletTransaction,
        },
      });
    } catch (error) {
      const statusCode = error.response?.status;

      if (statusCode && statusCode >= 400 && statusCode < 500) {
        await rollbackFailedWithdrawal(walletTransaction);
        return res.status(400).json({
          success: false,
          message:
            error.response?.data?.message || "Withdrawal could not be completed.",
        });
      }

      return res.status(202).json({
        success: true,
        message:
          "Withdrawal is being processed. Check your transaction history for the final status.",
        data: {
          withdrawalAmount: withdrawAmount,
          fee,
          netReceiveAmount,
          payoutReference,
          payoutStatus: "processing",
          transaction: walletTransaction,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};