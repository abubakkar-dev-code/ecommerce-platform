"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/:productId/:varientId", auth_middleware_1.authenticate, cart_controller_1.createCart);
router.get("/", auth_middleware_1.authenticate, cart_controller_1.getCart);
router.patch("/:varientId", auth_middleware_1.authenticate, cart_controller_1.updateCart);
router.delete("/clear", auth_middleware_1.authenticate, cart_controller_1.clearCart);
router.delete("/:varientId", auth_middleware_1.authenticate, cart_controller_1.removeCart);
exports.default = router;
