const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const {
  createOrUpdateDesignerProfile,
  getAllDesignerProfiles,
  getDesignerProfile,
  updateDesignerProfile,
  deleteDesignerProfile,
} = require('../controller/designerProfile')
const { authorizeRoles } = require('../middlewares/authorization') 
const { authentication } = require('../middlewares/authentication')

router.post('/create', authentication, authorizeRoles('designer'), upload.single('profilePhoto'), createOrUpdateDesignerProfile);
router.get('/getAll', getAllDesignerProfiles);
router.get('/getByDesigner/:designerId', getDesignerProfile);
router.put('/update', authentication, authorizeRoles('designer'), upload.single('profilePhoto'), updateDesignerProfile);
router.delete('/delete', authentication, authorizeRoles('designer'), deleteDesignerProfile);

module.exports = router;
