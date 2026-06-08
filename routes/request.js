const router = require('express').Router()

const {createRequest, sendOffer, acceptRequest, rejectRequest, completeRequest, rateDesigner } = require('../controller/request')
const { authentication } = require('../middlewares/authentication')
const { authorizeRoles } = require('../middlewares/authorization')

router.post('/create', authentication, authorizeRoles('customer'), createRequest);
router.put('/send-offer/:id', authentication, authorizeRoles('customer'), sendOffer);
router.put('/accept/:id', authentication, authorizeRoles('customer'), acceptRequest);
router.put('/reject/:id', authentication, authorizeRoles('customer'), rejectRequest);
router.put('/complete/:id', authentication, authorizeRoles('customer'), completeRequest);
router.put('/rate/:id', authentication, authorizeRoles('customer'), rateDesigner);

module.exports = router
