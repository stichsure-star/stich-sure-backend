const router = require('express').Router();
const {
  createDesignerWallet,
  updateDesignerWallet,
  getDesignerWallet,
  getTransactionHistory,
  getAllWallets,
} = require('../controller/designerWallet');
const { authentication } = require('../middlewares/authentication');
const { createWalletValidator, updateWalletValidator } = require('../middlewares/bodyValidation');

router.get('/all', authentication, getAllWallets);
router.post('/create', authentication, createWalletValidator, createDesignerWallet);
router.put('/update', authentication, updateWalletValidator, updateDesignerWallet);
router.get('/get', authentication, getDesignerWallet);
router.get('/transactions', authentication, getTransactionHistory);

module.exports = router;
