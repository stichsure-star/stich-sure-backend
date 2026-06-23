const router = require('express').Router();
const {
  createDesignerWallet,
  updateDesignerWallet,
  getDesignerWallet,
  getTransactionHistory,
  getAllWallets,
  withdrawFunds,
  getBanks,
  resolveBankAccountDetails,
} = require('../controller/designerWallet');
const { authentication } = require('../middlewares/authentication');
const { createWalletValidator, updateWalletValidator, withdrawalValidator, resolveBankAccountValidator } = require('../middlewares/bodyValidation');

router.get('/all', authentication, getAllWallets);
router.get('/banks', authentication, getBanks);
router.post('/banks/resolve', authentication, resolveBankAccountValidator, resolveBankAccountDetails);
router.post('/create', authentication, createWalletValidator, createDesignerWallet);
router.put('/update', authentication, updateWalletValidator, updateDesignerWallet);
router.get('/get', authentication, getDesignerWallet);
router.get('/transactions', authentication, getTransactionHistory);
router.post('/withdraw', authentication, withdrawalValidator, withdrawFunds);

module.exports = router;
