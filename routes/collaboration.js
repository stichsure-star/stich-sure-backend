const router = require('express').Router();

const {
  createCollaboration,
  getSentCollaborations,
  getReceivedCollaborations,
  getOneCollaboration,
  acceptCollaboration,
  rejectCollaboration,
  completeCollaboration, 
  cancelCollaboration, 
  getCollaborationStats, 
  getAllCollaborations,
  initializeCollaborationPayment, 
  verifyCollaborationPayment    
} = require('../controller/collaboration');

const { authentication} = require('../middlewares/authentication');
const {authorizeRoles} = require('../middlewares/authorization')
const {createCollaborationValidator} = require('../middlewares/bodyValidation');


router.post('/create', authentication, authorizeRoles('designer'), createCollaborationValidator, createCollaboration);
router.get('/sent', authentication, authorizeRoles('designer'), getSentCollaborations);
router.get('/received', authentication, authorizeRoles('designer'), getReceivedCollaborations);
router.get('/stats', authentication, authorizeRoles('designer'), getCollaborationStats);
router.get('/getById/:id', authentication, authorizeRoles('designer'), getOneCollaboration);

router.put('/accept/:id', authentication, authorizeRoles('designer'), acceptCollaboration);
router.put('/reject/:id', authentication, authorizeRoles('designer'), rejectCollaboration);
router.put('/complete/:id', authentication, authorizeRoles('designer'), completeCollaboration);
router.put('/cancel/:id', authentication, authorizeRoles('designer'), cancelCollaboration);

router.post('/initialize-payment', authentication, authorizeRoles('designer'), initializeCollaborationPayment);
router.get('/verify-payment/:reference', authentication, authorizeRoles('designer'), verifyCollaborationPayment);

module.exports = router;