const router = require('express').Router()

const { createCustomer, loginCustomer, forgetPassword, setPassword, verifyOtp, loginWithGoogle, updateCustomerProfile } = require('../controller/customer')
const { profile, loginProfile } = require('../middlewares/passport')
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')

router.post('/', createCustomer);
router.post('/login', loginCustomer);
router.post('/forget-password', forgetPassword)
router.post('/set-password', authentication, setPassword)
router.post('/otp', verifyOtp)
router.put('/update-profile/:id', upload.single('profilePhoto'), updateCustomerProfile);
router.get('/auth/google', profile)
router.get('/auth/google/callback', loginProfile, loginWithGoogle)

module.exports = router;
