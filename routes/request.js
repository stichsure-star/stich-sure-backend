const router = require('express').Router()

const {
  createRequest,
  sendOffer,
  acceptRequest,
  rejectRequest,
  completeRequest,
  updateRequestProgress,
  getRequestTracking,
  rateDesigner
} = require('../controller/request')
const { authentication } = require('../middlewares/authentication')

router.post('/create', authentication,  createRequest);
router.put('/send-offer/:id', authentication,  sendOffer);
router.put('/accept/:id', authentication,  acceptRequest);
router.put('/reject/:id', authentication, rejectRequest);
router.put('/complete/:id', authentication,  completeRequest);
router.put('/progress/:id', authentication, updateRequestProgress);
router.get('/tracking/:id', authentication, getRequestTracking);
router.put('/rate/:id', authentication,  rateDesigner);

module.exports = router
