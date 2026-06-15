const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const { authentication } = require('../middlewares/authentication');


const {
  createDesigner,
  loginDesigner,
  verifyEmail,
  forgetPassword,
  resetPassword,
  updatePassword,
  resendOTP,
  logOut,
  getAllDesigners,
  getOneDesigner,
  updateProfile
} = require('../controller/designer');
const {
  createDesignerValidator,
  loginValidator,
  verifyEmailValidator,
  resendOtpValidator,
  forgetPasswordValidator,
  resetPasswordValidator,
  updatePasswordValidator
} = require('../middlewares/designerValidator');


router.post('/create', createDesignerValidator, createDesigner);
router.post('/login', loginValidator, loginDesigner);
router.post('/verify', verifyEmailValidator, verifyEmail);
router.post('/resend-otp', resendOtpValidator, resendOTP);
router.post('/forget-password', forgetPasswordValidator, forgetPassword);
router.put('/update-password-setting', authentication, updatePasswordValidator, updatePassword)
router.post('/reset-password', authentication, resetPasswordValidator, resetPassword);
router.post('/logout', authentication, logOut);
router.get('/all-designer', getAllDesigners);
router.get('/one/:id', getOneDesigner);
router.put('/update',authentication, updateProfile)


module.exports = router;
