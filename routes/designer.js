const router = require('express').Router()

const passport = require('passport')

const { createDesingner, forgetPassword, verifyOtp } = require('../controller/designer')

router.post('/create-designer', createDesingner )

router.post('/reset-password', forgetPassword)

router.post('/verify-otp', verifyOtp)

router.get('/collect', passport.authenticate('google', {scope: ['profile', 'email']}))

router.get('/googleLogin', passport.authenticate('google', {
    successRedirect: '/api/designer/loginsuccess', 
    failureRedirect: '/api/designer/loginfailed'}))

router.get('/loginsuccess', (req, res) => {
        res.json({message: 'Login successful', 
            data: req.user})
    })

router.get('/loginfailed', (req, res) => {
        res.json({message: 'Login failed'})
    })  

module.exports = router