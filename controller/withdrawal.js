const axios = require('axios');
const { DesignerWallet, Withdrawal, Designer } = require('../models');
const { sendSMS } = require('../utils/sms');

exports.getBanks = async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.flutterwave.com/v3/banks/NG',
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Banks retrieved successfully',
      data: response.data.data,
    });
  } catch (error) {
    console.log('getBanks error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to fetch banks',
      error: error.response?.data || error.message,
    });
  }
};

exports.verifyAccount = async (req, res) => {
  try {
    const { account, bank } = req.body;

    if (!account || !bank) {
      return res.status(400).json({
        success: false,
        message: 'Account number (account) and bank code (bank) are required',
      });
    }

    const response = await axios.post(
      'https://api.flutterwave.com/v3/accounts/resolve',
      {
        account_number: account,
        account_bank: bank,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      data: response.data.data,
    });
  } catch (error) {
    console.log('verifyAccount error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to verify account',
      error: error.response?.data || error.message,
    });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const designerId = req.user.id;
    const { amount, useNewAccount, bankName, accountNumber, accountName, bankCode } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required',
      });
    }

    const designer = await Designer.findByPk(designerId);
    if (!designer) {
      return res.status(404).json({
        success: false,
        message: 'Designer not found',
      });
    }

    const wallet = await DesignerWallet.findOne({ where: { designerId } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    if (wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        available: wallet.availableBalance,
        requested: amount,
      });
    }

    let withdrawBankName, withdrawAccountNumber, withdrawAccountName, withdrawBankCode;

    if (useNewAccount) {
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({
          success: false,
          message: 'Bank name, account number and account name are required for new account withdrawal',
        });
      }
      withdrawBankName = bankName;
      withdrawAccountNumber = accountNumber;
      withdrawAccountName = accountName;
      withdrawBankCode = bankCode;
    } else {
      if (!wallet.bankName || !wallet.accountNumber || !wallet.accountName) {
        return res.status(400).json({
          success: false,
          message: 'No saved bank account found. Please provide bank details or update your profile.',
        });
      }
      withdrawBankName = wallet.bankName;
      withdrawAccountNumber = wallet.accountNumber;
      withdrawAccountName = wallet.accountName;
      withdrawBankCode = wallet.bankCode || bankCode;
    }

    if (!withdrawBankCode) {
      return res.status(400).json({
        success: false,
        message: 'Bank code is required. Please fetch banks list and provide the correct bank code.',
      });
    }

    const reference = `WIT_${designerId.slice(0, 8)}_${Date.now()}`;

    const withdrawal = await Withdrawal.create({
      designerId,
      amount,
      bankName: withdrawBankName,
      accountNumber: withdrawAccountNumber,
      accountName: withdrawAccountName,
      bankCode: withdrawBankCode,
      reference,
      status: 'pending',
    });

    await wallet.update({
      availableBalance: wallet.availableBalance - amount,
      pendingWithdrawal: (wallet.pendingWithdrawal || 0) + amount,
    });

    let transferResponse;

    if (process.env.NODE_ENV === 'development') {
      console.log(' Using MOCK transfer — development mode');
      transferResponse = {
        data: {
          data: {
            id: `mock_transfer_${Date.now()}`,
            transaction_id: `mock_txn_${Date.now()}`,
            status: 'processing',
          }
        }
      };
    }
    await withdrawal.update({
      status: 'success',
    });

    await wallet.update({
      withdrawn: (wallet.withdrawn || 0) + amount,
      pendingWithdrawal: Math.max(0, (wallet.pendingWithdrawal || 0) - amount),
      lastWithdrawnAt: new Date(),
    });


    if (designer.phone) {
      await sendSMS({
        to: designer.phone,
        message: `StitchSure: Your withdrawal of NGN ${Number(amount).toLocaleString()} to ${withdrawBankName} (${withdrawAccountNumber}) has been initiated successfully. Reference: ${reference}`,
      });
    }


    return res.status(200).json({
      success: true,
      message: 'Withdrawal initiated successfully. Funds will be transferred shortly.',
      withdrawal: {
        id: withdrawal.id,
        reference: withdrawal.reference,
        amount: withdrawal.amount,
        bankName: withdrawal.bankName,
        accountNumber: withdrawal.accountNumber,
        accountName: withdrawal.accountName,
        status: 'success',
      },
      wallet: {
        availableBalance: wallet.availableBalance,
        withdrawn: wallet.withdrawn,
      },
    });
  } catch (error) {
    console.log('Withdrawal error:', error.response?.data || error.message);

    try {
      const wallet = await DesignerWallet.findOne({
        where: { designerId: req.user.id }
      });

      if (wallet && req.body.amount) {
        await wallet.update({
          availableBalance: wallet.availableBalance + Number(req.body.amount),
          pendingWithdrawal: Math.max(0, (wallet.pendingWithdrawal || 0) - Number(req.body.amount)),
        });
      }

      await Withdrawal.update(
        {
          status: 'failed',
          failureReason: error.response?.data?.message || error.message
        },
        { where: { designerId: req.user.id, status: 'pending' } }
      );

      const designer = await Designer.findByPk(req.user.id);
      if (designer?.phone) {
        await sendSMS({
          to: designer.phone,
          message: `StitchSure: Your withdrawal of NGN ${Number(req.body.amount).toLocaleString()} could not be processed. Your balance has been refunded. Please try again or contact support.`,
        });
      }
      // ====================================================

    } catch (refundError) {
      console.log('Refund error:', refundError.message);
    }

    return res.status(500).json({
      success: false,
      message: 'Withdrawal failed',
      error: error.response?.data || error.message,
    });
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    const designerId = req.user.id;

    const withdrawals = await Withdrawal.findAll({
      where: { designerId },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Withdrawal history retrieved',
      data: withdrawals,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to get withdrawals' });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const designerId = req.user.id;

    const wallet = await DesignerWallet.findOne({ where: { designerId } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Wallet balance retrieved',
      data: {
        availableBalance: wallet.availableBalance,
        totalEarnings: wallet.totalEarnings,
        withdrawn: wallet.withdrawn,
        pendingWithdrawal: wallet.pendingWithdrawal || 0,
        bankName: wallet.bankName,
        accountNumber: wallet.accountNumber,
        accountName: wallet.accountName,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to get wallet balance' });
  }
};