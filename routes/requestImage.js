const router = require('express').Router()
const { upload } = require('../middlewares/multer')

const { createRequestImage, getRequestImages, getImagesByRequest, updateRequestImage, deleteRequestImage} = require('../controller/requestImage')
router.post('/create', upload.single('image'), createRequestImage)
router.get('/getAll', getRequestImages)
router.get('/getByRequest/:requestId', getImagesByRequest)
router.put('/update/:id', upload.single('image'), updateRequestImage)
router.delete('/delete/:id', deleteRequestImage)

module.exports = router