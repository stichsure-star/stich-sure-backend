const router = require('express').Router()

const {createRequest, getAllRequests, getOneRequest, getDesignerRequests, updateRequest, deleteRequest} = require('../controller/request')

router.post('/create', createRequest)
router.get('/getAll', getAllRequests)
router.get('/getById/:id', getOneRequest)
router.get('/getDesignerRequests/:designerId', getDesignerRequests)
router.put('/update/:id', updateRequest)
router.delete('/delete/:id', deleteRequest)

module.exports = router