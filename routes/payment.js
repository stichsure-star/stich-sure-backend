const router = require("express").Router();
const { authentication } = require("../middlewares/authentication");
const {
    initiatePayment,
    verifyPayment,
    verifyWebhook,
} = require("../controller/payment");

router.post("/initiate/:orderId", authentication, initiatePayment);
router.get("/verify", authentication, verifyPayment);
router.post("/webhook", verifyWebhook);

module.exports = router;