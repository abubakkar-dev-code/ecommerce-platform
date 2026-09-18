"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const image_controller_1 = require("../controllers/image.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
router.post("/:productId", upload_1.default.single("image"), image_controller_1.createImage);
router.get("/:productId", image_controller_1.getProductImages);
router.patch("/:imageId", upload_1.default.single("image"), image_controller_1.updateImageById);
router.delete("/:imageId", image_controller_1.deleteImageById);
exports.default = router;
