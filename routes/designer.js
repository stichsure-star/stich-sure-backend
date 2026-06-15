const router = require('express').Router();

const { createDesingner, loginDesigner, verifyEmail, forgetPassword, resetPassword, resendOTP, logOut, updateProfile } = require('../controller/designer');
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
router.post('/logout', authentication, logOut )
router.put('/update',authentication, updateProfile)
module.exports = router;
