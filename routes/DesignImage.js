const router = require('express').Router()
const { upload } = require('../middlewares/multer')

const {createDesignImage, getAllDesignImages, getOneDesignImage, getAllDesignerImages, updateDesignImage, deleteDesignImage } = require('../controller/designImage')
router.post('/', upload.single('image'), createDesignImage)
router.get('/getAll', getAllDesignImages)
router.get('/getOne/:id', getOneDesignImage)
router.get('/getDesignerImages/:designerId', getAllDesignerImages)
router.put('/update/:id', upload.single('image'), updateDesignImage)
router.delete('/delete/:id', deleteDesignImage)

module.exports = router