import express from "express";
import {
  createInventory,
  deleteInventory,
  getInventory,
  getAdminInventory,
  updateInventory,
} from "../../controllers/inventory.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = express.Router();
router.post("/create-inventory", createInventory);
router.get("/varient/:id", getInventory);
router.get("/:id", authenticate, authorize("admin"), getAdminInventory);
router.patch("/:id", authenticate, authorize("admin"), updateInventory);
router.delete("/:id", authenticate, authorize("admin"), deleteInventory);
export default router;
