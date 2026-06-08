const router = require('express').Router()
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')
const {createDesign, getAllDesigns, getDesignById, getDesignerDesigns, updateDesign, deleteDesign} = require('../controller/designs')

router.post('/create', authentication,  upload.single('designImage'), createDesign)
router.get('/getAll', getAllDesigns)
router.get('/getById/:id', getDesignById)
router.get('/getDesignerDesigns/:designerId', getDesignerDesigns)
router.put('/update/:id', authentication,  upload.single('designImage'), updateDesign)
router.delete('/delete/:id', authentication,  deleteDesign)

module.exports = router
