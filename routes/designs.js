const router = require('express').Router()
const { upload } = require('../middlewares/multer')

const {createDesign, getAllDesigns, getDesignById, getDesignerDesigns, updateDesign, deleteDesign} = require('../controller/designs')

router.post('/create', upload.single('designImage'), createDesign)
router.get('/getAll', getAllDesigns)
router.get('/getById/:id', getDesignById)
router.get('/getDesignerDesigns/:designerId', getDesignerDesigns)
router.put('/update/:id', upload.single('designImage'), updateDesign)
router.delete('/delete/:id', deleteDesign)

module.exports = router
