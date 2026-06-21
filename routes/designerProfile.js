const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const {
  createOrUpdateDesignerProfile,
  createOrUpdateDesignerOnboarding,
  getAllDesignerProfiles,
  getFeaturedDesigners,
  getDesignerProfile,
  getDesignerDashboardStats,
  getDesignerOrderDashboardStats,
  updateDesignerProfile,
  deleteDesignerProfile,
  updateDesignerProfileSettings
} = require('../controller/designerProfile')
const { authentication } = require('../middlewares/authentication')
const {
  designerOnboardingValidator,
  designerProfileCreateValidator,
  designerProfileUpdateValidator,
} = require('../middlewares/bodyValidation')

router.route('/onboarding')
  .put(authentication, upload.single('profilePhoto'), designerOnboardingValidator, createOrUpdateDesignerOnboarding)
  .patch(authentication, upload.single('profilePhoto'), designerOnboardingValidator, createOrUpdateDesignerOnboarding)
  .post(authentication, upload.single('profilePhoto'), designerOnboardingValidator, createOrUpdateDesignerOnboarding);
// router.post('/create', authentication, upload.single('profilePhoto'), designerProfileCreateValidator, createOrUpdateDesignerProfile);
router.get('/getAll', getAllDesignerProfiles);
router.get('/featured', getFeaturedDesigners);
router.get('/dashboard-stats', authentication, getDesignerDashboardStats);
router.get('/getByDesigner/:designerId', getDesignerProfile);
router.patch('/update', authentication, upload.single('profilePhoto'), designerProfileUpdateValidator, updateDesignerProfile);
router.patch('/updateDesignerProfileSettings', authentication, upload.single('profilePhoto'), updateDesignerProfileSettings);
router.delete('/delete', authentication, deleteDesignerProfile);

module.exports = router;
