const router = require('express').Router();

const {createCollaboration,getSentCollaborations,getReceivedCollaborations,getOneCollaboration,acceptCollaboration,rejectCollaboration,completeCollaboration, cancelCollaboration, getCollaborationStats, getAllCollaborations} = require('../controller/collaboration');

const { authentication } = require('../middlewares/authentication');
const { authorizeRoles } = require('../middlewares/authorization');

router.get('/', authentication, getAllCollaborations);
router.post('/create', authentication, authorizeRoles('designer'), createCollaboration);
router.get('/sent', authentication, authorizeRoles('designer'), getSentCollaborations);
router.get('/received', authentication, authorizeRoles('designer'), getReceivedCollaborations);
router.get('/stats', authentication, authorizeRoles('designer'), getCollaborationStats);
router.get('/getById/:id', authentication, authorizeRoles('designer'), getOneCollaboration);
router.put('/accept/:id', authentication, authorizeRoles('designer'), acceptCollaboration);
router.put('/reject/:id', authentication, authorizeRoles('designer'), rejectCollaboration);
router.put('/complete/:id', authentication, authorizeRoles('designer'), completeCollaboration);
router.put('/cancel/:id', authentication, authorizeRoles('designer'), cancelCollaboration);

module.exports = router;
