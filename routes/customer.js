const router = require('express').Router()

const { createCustomer, loginCustomer, forgetPassword, verifyOtp, loginWithGoogle, updateCustomer } = require('../controller/customer')
const { profile, loginProfile } = require('../middlewares/passport')

router.post('/', createCustomer);
router.post('/login', loginCustomer);
router.post('/forget-password', forgetPassword)
router.post('/otp', verifyOtp)
router.post('/update', updateCustomer)
router.get('/auth/google', profile)
router.get('/auth/google/callback', loginProfile, loginWithGoogle)

module.exports = router;