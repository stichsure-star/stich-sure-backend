const router = require('express').Router();

const { createDesingner, setPassword, forgetPassword } = require('../controller/designer')

router.post('/', createDesingner);

router.post('/set-password', setPassword)
router.post('/forget-password', forgetPassword)

module.exports = router