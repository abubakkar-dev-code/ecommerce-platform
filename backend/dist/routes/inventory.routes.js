"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inventory_controller_1 = require("../controllers/inventory.controller");
const router = express_1.default.Router();
router.post("/create-inventory", inventory_controller_1.createInventory);
router.get("/varient/:id", inventory_controller_1.getInventory);
router.patch("/:id", inventory_controller_1.updateInventory);
router.delete("/:id", inventory_controller_1.deleteInventory);
exports.default = router;
