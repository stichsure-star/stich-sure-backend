const router = require('express').Router()
const { upload } = require('../middlewares/multer')
const { authentication } = require('../middlewares/authentication')
const {createDesign, getAllDesigns, getDesignById, getDesignerDesigns, updateDesign, deleteDesign} = require('../controller/designs')
const { createDesignValidator, updateDesignValidator } = require('../middlewares/bodyValidation')

router.post('/create', authentication, upload.single('designImage'), createDesignValidator, createDesign)
router.get('/getAll', getAllDesigns)
router.get('/getById/:id', getDesignById)
router.get('/getDesignerDesigns/:designerId', getDesignerDesigns)
router.put('/update/:id', authentication, upload.single('designImage'), updateDesignValidator, updateDesign)
router.delete('/delete/:id', authentication,  deleteDesign)

module.exports = router
