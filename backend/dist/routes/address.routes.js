"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("../controllers/address.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authenticate, address_controller_1.createOrUpdateAddress);
router.get("/", auth_middleware_1.authenticate, address_controller_1.getAddress);
router.patch("/:addressId", auth_middleware_1.authenticate, address_controller_1.updateAddress);
router.delete("/:addressId", auth_middleware_1.authenticate, address_controller_1.removeAddress);
exports.default = router;
