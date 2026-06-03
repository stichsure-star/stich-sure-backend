const router = require('express').Router();

const { createDesingner, loginDesigner } = require('../controller/designer')

router.post('/', createDesingner);
router.post('/login', loginDesigner);

module.exports = router