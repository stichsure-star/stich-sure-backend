
const { Withdrawal, DesignerWallet } = require('../models');

const handleTransferWebhook = async (data, event) => {
  try {
    const reference = data.reference;
    if (!reference) return;

    const withdrawal = await Withdrawal.findOne({ where: { reference } });
    if (!withdrawal) return;

    if (event === 'transfer.success') {
      await withdrawal.update({ status: 'success' });


      const wallet = await DesignerWallet.findOne({
        where: { designerId: withdrawal.designerId }
      });

      if (wallet) {
        await wallet.update({
          pendingWithdrawal: Math.max(0, (wallet.pendingWithdrawal || 0) - withdrawal.amount),
        });
      }

      console.log(`Withdrawal ${reference} succeeded`);
    }

    if (event === 'transfer.failed') {
      await withdrawal.update({
        status: 'failed',
        failureReason: data.message || 'Transfer failed',
      });

      const wallet = await DesignerWallet.findOne({
        where: { designerId: withdrawal.designerId }
      });

      if (wallet) {
        await wallet.update({
          availableBalance: wallet.availableBalance + withdrawal.amount,
          pendingWithdrawal: Math.max(0, (wallet.pendingWithdrawal || 0) - withdrawal.amount),
          withdrawn: Math.max(0, (wallet.withdrawn || 0) - withdrawal.amount),
        });
      }

      console.log(`Withdrawal ${reference} failed — wallet refunded`);
    }
  } catch (error) {
    console.log('handleTransferWebhook error:', error.message);
  }
};

module.exports = { handleTransferWebhook };