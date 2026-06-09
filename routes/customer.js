const router = require('express').Router()

const { createCustomer, loginCustomer, forgetPassword, resetPassword, verifyEmail, loginWithGoogle, updateCustomerProfile, updatePassword, resendOTP } = require('../controller/customer')
const { profile, loginProfile } = require('../middlewares/passport')
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')
const { authorizeRoles } = require('../middlewares/authorization')
const { customerValidator, loginValidator, forgetPasswordValidator, resetPaswordValidator, updateCustomerProfileValidator, updatePasswordValidator } = require('../middlewares/customerValidation')

router.post('/register', customerValidator, createCustomer);
router.post('/login', loginValidator, loginCustomer);
router.post('/forget-password', forgetPasswordValidator, forgetPassword)
router.post('/reset-password', authentication, authorizeRoles('customer'), resetPaswordValidator, resetPassword)
router.post('/resend-otp', resendOTP)
router.post('/verify', verifyEmail)
router.put('/update-profile/:id', authentication, authorizeRoles('customer'), updateCustomerProfileValidator, upload.single('profilePhoto'), updateCustomerProfile);
router.put('/update-password', authentication, authorizeRoles('customer'), updatePasswordValidator, updatePassword)
router.get('/auth/google', profile)
router.get('/auth/google/callback', loginProfile, loginWithGoogle)

module.exports = router;
