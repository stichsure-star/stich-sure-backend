const {
  Order,
  Payment,
  DesignerWallet,
  DesignerWalletTransaction,
} = require("../models");

const releaseOrderEscrowToDesigner = async (orderId) => {
  const order = await Order.findByPk(orderId);

  if (!order || order.status !== "completed") {
    return {
      released: false,
      reason: "Order is not completed",
    };
  }

  const successfulPayment = await Payment.findOne({
    where: {
      orderId: order.id,
      status: "success",
    },
  });

  if (!successfulPayment) {
    return {
      released: false,
      reason: "No successful payment found for this order",
    };
  }

  const existingTransaction = await DesignerWalletTransaction.findOne({
    where: { orderId: order.id },
  });

  if (existingTransaction) {
    return {
      released: false,
      reason: "Escrow already released",
    };
  }

  const totalAmount = Number(successfulPayment.amount || order.amount || 0);

  if (totalAmount <= 0) {
    return {
      released: false,
      reason: "Invalid escrow amount",
    };
  }

  const commission = Math.round(totalAmount * 0.10);
  const netAmount = totalAmount - commission;

  let wallet = await DesignerWallet.findOne({
    where: { designerId: order.designerId },
  });

  if (!wallet) {
    wallet = await DesignerWallet.create({
      designerId: order.designerId,
      totalEarnings: 0,
      availableBalance: 0,
      withdrawn: 0,
    });
  }

  await wallet.update({
    totalEarnings: Number(wallet.totalEarnings) + netAmount,
    availableBalance: Number(wallet.availableBalance) + netAmount,
  });

  const transaction = await DesignerWalletTransaction.create({
    designerWalletId: wallet.id,
    designerId: order.designerId,
    orderId: order.id,
    transactionType: "order_credit",
    amount: netAmount,
    status: "completed",
    transactionDate: order.completedAt || new Date(),
  });

  return {
    released: true,
    reason: "Escrow released to designer wallet (10% commission deducted)",
    totalAmount,
    commissionDeducted: commission,
    amountCreditedToDesigner: netAmount,
    transaction,
  };
};

module.exports = {
  releaseOrderEscrowToDesigner,
};
