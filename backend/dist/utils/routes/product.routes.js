"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../../controllers/product.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = express_1.default.Router();
router.post("/create-product", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), product_controller_1.createProduct);
router.get("/", product_controller_1.getProducts);
router.get("/search", product_controller_1.searchProducts);
router.get("/filter", product_controller_1.filterProducts);
router.get("/:id", product_controller_1.getSingleProduct);
router.patch("/:id", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), product_controller_1.updateProduct);
router.delete("/:id", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), product_controller_1.deleteProduct);
exports.default = router;
