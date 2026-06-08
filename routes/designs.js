const router = require('express').Router()
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')
const { authorizeRoles } = require('../middlewares/authorization')
const {createDesign, getAllDesigns, getDesignById, getDesignerDesigns, updateDesign, deleteDesign} = require('../controller/designs')

router.post('/create', authentication, authorizeRoles('designer'), upload.single('designImage'), createDesign)
router.get('/getAll', getAllDesigns)
router.get('/getById/:id', getDesignById)
router.get('/getDesignerDesigns/:designerId', getDesignerDesigns)
router.put('/update/:id', authentication, authorizeRoles('designer'), upload.single('designImage'), updateDesign)
router.delete('/delete/:id', authentication, authorizeRoles('designer'), deleteDesign)

module.exports = router
