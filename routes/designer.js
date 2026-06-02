const router = require('express').Router();

const { createDesingner } = require('../controller/designer')

router.post('/', createDesingner);

module.exports = router