const router = require('express').Router()

const { createCustomer, loginCustomer, forgetPassword, resetPassword, verifyEmail, loginWithGoogle, updateCustomerProfile } = require('../controller/customer')
const { profile, loginProfile } = require('../middlewares/passport')
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')
const { customerValidator, loginValidator, updateValidator } = require('../middlewares/customerValidation')

router.post('/register', customerValidator, createCustomer);
router.post('/login', loginValidator, loginCustomer);
router.post('/forget-password', forgetPassword)
router.post('/reset-password', authentication, resetPassword)
router.post('/verify', verifyEmail)
router.put('/update-profile/:id', updateValidator, upload.single('profilePhoto'), updateCustomerProfile);
router.get('/auth/google', profile)
router.get('/auth/google/callback', loginProfile, loginWithGoogle)

module.exports = router;
