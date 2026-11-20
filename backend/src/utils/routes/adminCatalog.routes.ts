import express from "express";
import { getDashboard, listInventory } from "../../controllers/adminCatalog.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = express.Router();
router.get("/dashboard", authenticate, authorize("admin"), getDashboard);
router.get("/inventory", authenticate, authorize("admin"), listInventory);
export default router;
