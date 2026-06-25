const axios = require('axios');
const { DesignerWallet, DesignerProfile, Withdrawal } = require('../models');


exports.getBanks = async (req, res) => {
  try {
    console.log('KORA_SECRET_KEY:', process.env.KORA_SECRET_KEY?.slice(0, 15) + '...');

    const response = await axios.get(
      'https://api.korapay.com/merchant/api/v1/misc/banks?countryCode=NG',
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
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
      'https://api.korapay.com/merchant/api/v1/misc/banks/resolve',
      { 
        account,   
        bank,      
        currency: 'NGN', 
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
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

const transferResponse = await axios.post(
  'https://api.korapay.com/merchant/api/v1/transactions/disburse',
  {
    reference,
    destination: {
      type: 'bank_account',
      amount,
      currency: 'NGN',
      narration: `StitchSure withdrawal - ${withdrawAccountName}`,
      bank_account: {
        bank: withdrawBankCode,      
        account: withdrawAccountNumber, 
      },
      customer: {
        name: withdrawAccountName,
        email: designer.email,        
          },
    },
  },
  console.log('headers', headers),
  
  {
    headers: {
      Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  }
);
    console.log('Korapay transfer response:', JSON.stringify(transferResponse.data, null, 2));

    const transferData = transferResponse.data?.data;

    await withdrawal.update({
      korapayTransferId: transferData?.id || transferData?.transaction_id,
    });

    await wallet.update({
      withdrawn: (wallet.withdrawn || 0) + amount,
      lastWithdrawnAt: new Date(),
    });

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
        status: withdrawal.status,
      },
      wallet: {
        availableBalance: wallet.availableBalance - amount,
        withdrawn: (wallet.withdrawn || 0) + amount,
      },
    });
  } catch (error) {
    console.log('Withdrawal error:', error.response?.data || error.message);

    const wallet = await DesignerWallet.findOne({
      where: { designerId: req.user.id }
    });

    if (wallet && req.body.amount) {
      await wallet.update({
        availableBalance: wallet.availableBalance + req.body.amount,
        pendingWithdrawal: Math.max(0, (wallet.pendingWithdrawal || 0) - req.body.amount),
      });

      await Withdrawal.update(
        { status: 'failed', failureReason: error.response?.data?.message || error.message },
        { where: { reference: `WIT_${req.user.id.slice(0, 8)}_${Date.now()}` } }
      );
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