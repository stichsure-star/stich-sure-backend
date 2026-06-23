const {
  sequelize,
  DesignerWallet,
  DesignerWalletTransaction,
} = require("../models");

const WITHDRAWAL_PLATFORM_FEE = 100;

const generateWithdrawalReference = (designerId) =>
  `WD_${Date.now()}_${String(designerId).slice(0, 8)}`;

const handleTransferWebhook = async (data, event) => {
  const reference = data?.reference;
  if (!reference) {
    return { handled: false };
  }

  const transaction = await DesignerWalletTransaction.findOne({
    where: {
      payoutReference: reference,
      transactionType: "withdrawal",
    },
  });

  if (!transaction) {
    return { handled: false };
  }

  if (transaction.status === "completed" || transaction.status === "failed") {
    return { handled: true, alreadyProcessed: true };
  }

  const wallet = await DesignerWallet.findByPk(transaction.designerWalletId);
  if (!wallet) {
    return { handled: true, error: "Wallet not found for withdrawal transaction" };
  }

  const withdrawalAmount = Math.abs(Number(transaction.amount || 0));
  const isSuccess =
    event === "transfer.success" || data.status === "success";

  if (isSuccess) {
    await transaction.update({ status: "completed" });
    return { handled: true, status: "completed" };
  }

  await sequelize.transaction(async (dbTransaction) => {
    const lockedWallet = await DesignerWallet.findByPk(wallet.id, {
      transaction: dbTransaction,
      lock: dbTransaction.LOCK.UPDATE,
    });

    await lockedWallet.update(
      {
        availableBalance:
          Number(lockedWallet.availableBalance || 0) + withdrawalAmount,
        withdrawn: Math.max(
          0,
          Number(lockedWallet.withdrawn || 0) - withdrawalAmount
        ),
      },
      { transaction: dbTransaction }
    );

    await transaction.update(
      { status: "failed" },
      { transaction: dbTransaction }
    );
  });

  return { handled: true, status: "failed" };
};

const rollbackFailedWithdrawal = async (transaction) => {
  if (!transaction || transaction.status !== "pending") {
    return;
  }

  await sequelize.transaction(async (dbTransaction) => {
    const wallet = await DesignerWallet.findByPk(transaction.designerWalletId, {
      transaction: dbTransaction,
      lock: dbTransaction.LOCK.UPDATE,
    });

    if (!wallet) {
      return;
    }

    const withdrawalAmount = Math.abs(Number(transaction.amount || 0));

    await wallet.update(
      {
        availableBalance: Number(wallet.availableBalance || 0) + withdrawalAmount,
        withdrawn: Math.max(0, Number(wallet.withdrawn || 0) - withdrawalAmount),
      },
      { transaction: dbTransaction }
    );

    await transaction.update({ status: "failed" }, { transaction: dbTransaction });
  });
};

module.exports = {
  WITHDRAWAL_PLATFORM_FEE,
  generateWithdrawalReference,
  handleTransferWebhook,
  rollbackFailedWithdrawal,
};
