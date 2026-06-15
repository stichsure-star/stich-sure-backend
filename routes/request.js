const router = require('express').Router()

const {
  createRequest,
  sendOffer,
  acceptRequest,
  rejectRequest,
  completeRequest,
  updateRequestProgress,
  getRequestTracking,
  rateDesigner,
  getAllRequests,
  getOneRequest
} = require('../controller/request')
const { authentication } = require('../middlewares/authentication')
const {
  createRequestValidator,
  sendOfferValidator,
  requestProgressValidator,
  rateDesignerValidator,
} = require('../middlewares/bodyValidation')

router.get('/', authentication, getAllRequests);
router.get('/:id', authentication, getOneRequest);
router.post('/create', authentication, createRequestValidator, createRequest);
router.put('/send-offer/:id', authentication, sendOfferValidator, sendOffer);
router.put('/accept/:id', authentication,  acceptRequest);
router.put('/reject/:id', authentication, rejectRequest);
router.put('/complete/:id', authentication,  completeRequest);
router.put('/progress/:id', authentication, requestProgressValidator, updateRequestProgress);
router.get('/tracking/:id', authentication, getRequestTracking);
router.put('/rate/:id', authentication, rateDesignerValidator, rateDesigner);

module.exports = router
