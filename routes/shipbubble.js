const router = require("express").Router();

const {fetchRates,createOrder,trackOrder, validateAddress, getCategories} = require("../controller/shipbubble");

router.post("/rates", fetchRates);

router.post("/create", createOrder);

router.get("/track/:orderId", trackOrder);

router.post('/validate-address', validateAddress);

router.get('/categories', getCategories);

module.exports = router;
