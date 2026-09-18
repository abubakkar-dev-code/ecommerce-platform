"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = express_1.default.Router();
router.post("/create-category", category_controller_1.createCategory);
router.get("/", category_controller_1.getCategories);
router.get("/:slug", category_controller_1.getCategoriesBySlug);
router.patch("/:id", auth_middleware_1.authenticate, authorize_middleware_1.authorize, category_controller_1.updateCategories);
router.delete("/:id", auth_middleware_1.authenticate, authorize_middleware_1.authorize, category_controller_1.deleteCategory);
exports.default = router;
