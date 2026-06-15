const router = require("express").Router();

const {
  initializePayment
} = require("../controller/Payment");

router.post("/initialize", initializePayment);

module.exports = router;