const express = require('express');
const router = express.Router();
const {
  getBanks,
  verifyAccount,
  withdraw,
  getWithdrawals,
  getWalletBalance,
} = require('../controller/withdrawal');
const { authentication } = require('../middlewares/authentication');

router.get('/banks', authentication, getBanks);
router.post('/verify-account', authentication, verifyAccount);
router.post('/withdraw', authentication, withdraw);
router.get('/history', authentication, getWithdrawals);
router.get('/balance', authentication, getWalletBalance);

module.exports = router;