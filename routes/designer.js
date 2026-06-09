const router = require('express').Router();

const { createDesingner, loginDesigner, verifyEmail, forgetPassword, resetPassword, resendOTP } = require('../controller/designer');
const {
  createDesignerValidator,
  loginValidator,
  verifyEmailValidator,
  forgetPasswordValidator,
  resetPasswordValidator,
} = require('../middlewares/designerValidator');
const { authentication } = require('../middlewares/authentication');

router.post('/create', createDesignerValidator, createDesingner);
router.post('/login', loginValidator, loginDesigner);
router.post('/verify', verifyEmailValidator, verifyEmail);
router.post('/resend-otp', resendOTP)
router.post('/forget-password', forgetPasswordValidator, forgetPassword);
router.post('/reset-password', authentication, resetPasswordValidator, resetPassword);

module.exports = router;
