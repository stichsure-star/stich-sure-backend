const router = require('express').Router();
const {
  createDesignerWallet,
  updateDesignerWallet,
  getDesignerWallet,
} = require('../controller/designerWallet');
const { authentication } = require('../middlewares/authentication');

router.post('/create', authentication, createDesignerWallet);
router.put('/update', authentication, updateDesignerWallet);
router.get('/get', authentication, getDesignerWallet);

module.exports = router;
