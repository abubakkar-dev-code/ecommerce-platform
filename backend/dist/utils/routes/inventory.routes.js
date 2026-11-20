"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inventory_controller_1 = require("../../controllers/inventory.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = express_1.default.Router();
router.post("/create-inventory", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), inventory_controller_1.createInventory);
router.get("/varient/:id", inventory_controller_1.getInventory);
router.get("/:id", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), inventory_controller_1.getAdminInventory);
router.patch("/:id", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), inventory_controller_1.updateInventory);
router.delete("/:id", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), inventory_controller_1.deleteInventory);
exports.default = router;
