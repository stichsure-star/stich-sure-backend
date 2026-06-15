const router = require('express').Router()

const {
  createCustomer,
  loginCustomer,
  forgetPassword,
  resetPassword,
  verifyEmail,
  loginWithGoogle,
  updateCustomerProfile,
  updatePassword,
  resendOTP,
  logOut,
  getCustomerDashboardStats,
  saveDesigner,
  getSavedDesigners,
  removeSavedDesigner,
  getAllCustomers,
  getOneCustomer,
} = require('../controller/customer')
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')
const {
  customerValidator,
  loginValidator,
  forgetPasswordValidator,
  resetPaswordValidator,
  verifyEmailValidator,
  resendOtpValidator,
  updateCustomerProfileValidator,
  updatePasswordValidator
} = require('../middlewares/customerValidation')

router.post('/register', customerValidator, createCustomer);
router.post('/verify', verifyEmailValidator, verifyEmail)
router.post('/login', loginValidator, loginCustomer);
router.post('/forget-password', forgetPasswordValidator, forgetPassword)
router.post('/reset-password', authentication, resetPaswordValidator, resetPassword)
router.post('/resend-otp', resendOtpValidator, resendOTP)
router.post('/logout', authentication, logOut )
router.get('/dashboard-stats', authentication, getCustomerDashboardStats);
router.post('/saved-designers/:designerId', authentication, saveDesigner);
router.get('/saved-designers', authentication, getSavedDesigners);
router.delete('/saved-designers/:designerId', authentication, removeSavedDesigner);
router.put('/update-profile/:id', authentication, updateCustomerProfileValidator, upload.single('profilePhoto'), updateCustomerProfile);
router.put('/update-password', authentication, updatePasswordValidator, updatePassword)
router.get('/',  getAllCustomers);
router.get('/:id', getOneCustomer);

module.exports = router;
