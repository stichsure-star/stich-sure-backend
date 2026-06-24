const router = require('express').Router()

const {
  createRequest,
  completeRequest,
  updateRequestProgress,
  getRequestTracking,
  rateDesigner,
  getAllRequests,
  getOneRequest,
  rejectRequest,
  acceptRequestFromCustomer
} = require('../controller/request')
const {upload} = require('../middlewares/multer')
console.log({
  createRequest,
  rejectRequest,
  completeRequest,
  updateRequestProgress,
  getRequestTracking,
  rateDesigner,
  getAllRequests,
  getOneRequest
});
const { authentication } = require('../middlewares/authentication')
const {
  createRequestValidator,
  requestProgressValidator,
  rateDesignerValidator,
} = require('../middlewares/bodyValidation')

router.get('/', authentication, getAllRequests);
router.get('/:id', authentication, getOneRequest);
router.post('/create/:designerId', authentication, upload.single('designImage'), createRequestValidator, createRequest);
router.put('/complete/:id', authentication, completeRequest);
router.put('/progress/:id', authentication, requestProgressValidator, updateRequestProgress);
router.put('/accept/:id', authentication, acceptRequestFromCustomer);
router.put('/reject/:id', authentication, rejectRequest);
router.get('/tracking/:id', authentication, getRequestTracking);
router.put('/rate/:id', authentication, rateDesignerValidator, rateDesigner);
router.get('/:id', authentication, getOneRequest);

module.exports = router
