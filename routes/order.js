const router = require("express").Router();
const { authentication } = require("../middlewares/authentication");
const {
  createOrder,
  getDesignerOrders,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require("../controller/order");

router.get("/", authentication, getAllOrders);
router.post("/create", authentication, createOrder);
router.get("/designer", authentication, getDesignerOrders);
router.get("/customer", authentication, getCustomerOrders);
router.get("/:id", authentication, getOrderById);
router.put("/:id/status", authentication, updateOrderStatus);

module.exports = router;
