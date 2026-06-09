const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const {
  createOrUpdateDesignerProfile,
  getAllDesignerProfiles,
  getDesignerProfile,
  updateDesignerProfile,
  deleteDesignerProfile,
  createDesignerWallet,
  updateDesignerWallet,
  getDesignerWallet,
} = require('../controller/designerProfile')
const { authentication } = require('../middlewares/authentication')

router.post('/create', authentication, upload.single('profilePhoto'), createOrUpdateDesignerProfile);
router.get('/getAll', getAllDesignerProfiles);
router.get('/getByDesigner/:designerId', getDesignerProfile);
router.put('/update', authentication, upload.single('profilePhoto'), updateDesignerProfile);
router.delete('/delete', authentication, deleteDesignerProfile);

router.post('/wallet', authentication, createDesignerWallet);
router.put('/update-wallet', authentication, updateDesignerWallet);
router.get('/get-wallet', authentication, getDesignerWallet);

module.exports = router;
