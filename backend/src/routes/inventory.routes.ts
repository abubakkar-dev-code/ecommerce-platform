import express from "express";
import {
  createInventory,
  deleteInventory,
  getInventory,
  updateInventory,
} from "../controllers/inventory.controller";

const router = express.Router();
router.post("/create-inventory", createInventory);
router.get("/varient/:id", getInventory);
router.patch("/:id", updateInventory);
router.delete("/:id", deleteInventory);
export default router;
