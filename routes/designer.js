const router = require('express').Router();

const { createDesingner, loginDesigner, forgetPassword, setPassword } = require('../controller/designer')

router.post('/', createDesingner);
router.post('/login', loginDesigner);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', setPassword);

module.exports = router