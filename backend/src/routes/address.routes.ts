import express from "express";
import {
  createOrUpdateAddress,
  getAddress,
  removeAddress,
  updateAddress,
} from "../controllers/address.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();
router.post("/", authenticate, createOrUpdateAddress);
router.get("/", authenticate, getAddress);
router.patch("/:addressId", authenticate, updateAddress);
router.delete("/:addressId", authenticate, removeAddress);
export default router;
