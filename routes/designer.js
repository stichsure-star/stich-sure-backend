const router = require('express').Router();

const { createDesingner, loginDesigner, forgetPassword, resetPassword } = require('../controller/designer')
const { designerValidator } = require('../middlewares/designerValidator')
const { authentication } = require('../middlewares/authentication')

router.post('/create', designerValidator, createDesingner);
router.post('/login', loginDesigner);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', authentication, resetPassword);

module.exports = router
