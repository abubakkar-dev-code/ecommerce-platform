"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wishList_controller_1 = require("../controllers/wishList.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/:productId", auth_middleware_1.authenticate, wishList_controller_1.createWishList);
router.get("/", auth_middleware_1.authenticate, wishList_controller_1.getwishList);
router.delete("/:productId", auth_middleware_1.authenticate, wishList_controller_1.removeWishList);
exports.default = router;
