const router = require("express").Router();
const { authentication } = require("../middlewares/authentication");
const {
  createOrder,
  getDesignerOrders,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  getDesignerOrderById,
  // getCustomerOrderById,
  getOrdersByDesignerId,
  getOrdersByCustomerId,
} = require("../controller/order");

const {
  createOrderValidator,
  updateOrderStatusValidator,
} = require("../middlewares/bodyValidation");

router.get("/", authentication, getAllOrders);
router.post("/create", authentication, createOrderValidator, createOrder);
router.get("/designer", authentication, getDesignerOrders);
router.get("/customer", authentication, getCustomerOrders);
router.get("/designer/list/:designerId", authentication, getOrdersByDesignerId);
router.get("/customer/list/:customerId", authentication, getOrdersByCustomerId);
router.get("/designer/:id", authentication, getDesignerOrderById);
// router.get("/customer/:id", authentication, getCustomerOrderById);
router.get("/:id", authentication, getOrderById);
router.put("/:id/status", authentication, updateOrderStatusValidator, updateOrderStatus);

module.exports = router;
