const router = require('express').Router();

const { createDesingner, loginDesigner, forgetPassword, resetPassword } = require('../controller/designer');
const {
  createDesignerValidator,
  loginValidator,
  forgetPasswordValidator,
  resetPasswordValidator,
} = require('../middlewares/designerValidator');
const { authentication } = require('../middlewares/authentication');

router.post('/create', createDesignerValidator, createDesingner);
router.post('/login', loginValidator, loginDesigner);
router.post('/forget-password', forgetPasswordValidator, forgetPassword);
router.post('/reset-password', authentication, resetPasswordValidator, resetPassword);

module.exports = router;
