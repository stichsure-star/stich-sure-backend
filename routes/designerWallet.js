const router = require('express').Router();
const {
  createDesignerWallet,
  updateDesignerWallet,
  getDesignerWallet,
  getTransactionHistory,
  getAllWallets,
  withdrawFunds,
} = require('../controller/designerWallet');
const { authentication } = require('../middlewares/authentication');
const { createWalletValidator, updateWalletValidator, withdrawalValidator } = require('../middlewares/bodyValidation');

router.get('/all', authentication, getAllWallets);
router.post('/create', authentication, createWalletValidator, createDesignerWallet);
router.put('/update', authentication, updateWalletValidator, updateDesignerWallet);
router.get('/get', authentication, getDesignerWallet);
router.get('/transactions', authentication, getTransactionHistory);
router.post('/withdraw', authentication, withdrawalValidator, withdrawFunds);

module.exports = router;
