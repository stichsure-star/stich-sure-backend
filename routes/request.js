const router = require('express').Router()

const {
  createRequest,
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
  requestProgressValidator,
  rateDesignerValidator,
} = require('../middlewares/bodyValidation')

router.post('/create/:designerId', authentication, createRequestValidator, createRequest);
router.get('/', authentication, getAllRequests);
router.put('/complete/:id', authentication, completeRequest);
router.put('/progress/:id', authentication, requestProgressValidator, updateRequestProgress);
router.get('/tracking/:id', authentication, getRequestTracking);
router.put('/rate/:id', authentication, rateDesignerValidator, rateDesigner);
router.get('/:id', authentication, getOneRequest);

module.exports = router
