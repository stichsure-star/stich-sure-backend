const router = require('express').Router();

const { loginWithGoogle } = require('../controller/customer');
const { profile, designerProfile, loginProfile } = require('../middlewares/passport');

router.get('/google', profile);
router.get('/google/callback', loginProfile, loginWithGoogle);

module.exports = router;
