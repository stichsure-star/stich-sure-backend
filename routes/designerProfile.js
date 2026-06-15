const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const {
  createOrUpdateDesignerProfile,
  createOrUpdateDesignerOnboarding,
  getAllDesignerProfiles,
  getDesignerProfile,
  getDesignerDashboardStats,
  getDesignerOrderDashboardStats,
  updateDesignerProfile,
  deleteDesignerProfile,
} = require('../controller/designerProfile')
const { authentication } = require('../middlewares/authentication')

router.post('/onboarding', authentication, upload.single('profilePhoto'), createOrUpdateDesignerOnboarding);
router.post('/create', authentication, upload.single('profilePhoto'), createOrUpdateDesignerProfile);
router.get('/getAll', getAllDesignerProfiles);
router.get('/dashboard-stats', authentication, getDesignerDashboardStats);
router.get('/getByDesigner/:designerId', getDesignerProfile);
router.put('/update', authentication, upload.single('profilePhoto'), updateDesignerProfile);
router.delete('/delete', authentication, deleteDesignerProfile);

module.exports = router;
