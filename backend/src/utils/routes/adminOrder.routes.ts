import express from "express";
import { getAdminOrder, listAdminOrders, updateFulfillment } from "../../controllers/adminOrder.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = express.Router();
router.use(authenticate, authorize("admin"));
router.get("/", listAdminOrders);
router.get("/:orderId", getAdminOrder);
router.patch("/:orderId/fulfillment", updateFulfillment);
export default router;
