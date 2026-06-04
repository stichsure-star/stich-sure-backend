const router = require('express').Router()

const {createDesign, getAllDesigns, getDesignById, getDesignerDesigns, updateDesign, deleteDesign} = require('../controller/designs')

router.post('/create', createDesign)
router.get('/getAll', getAllDesigns)
router.get('/getById/:id', getDesignById)
router.get('/getDesignerDesigns/:designerId', getDesignerDesigns)
router.put('/update/:id', updateDesign)
router.delete('/delete/:id', deleteDesign)

module.exports = router