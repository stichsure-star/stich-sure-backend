const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const {
  createDesignerProfile,
  getDesignerProfile,
  getAllDesignerProfiles,
  updateDesignerProfile,
  deleteDesignerProfile
} = require('../controller/designerProfile');
const { authentication } = require('../middlewares/authentication')

router.post('/create', authentication, upload.single('profilePhoto'), createDesignerProfile);
router.get('/getAll', getAllDesignerProfiles);
router.get('/getByDesigner/:designerId', getDesignerProfile);
router.put('/update/:designerId', authentication, upload.single('profilePhoto'), updateDesignerProfile);
router.delete('/delete/:designerId', authentication, deleteDesignerProfile);

module.exports = router;
