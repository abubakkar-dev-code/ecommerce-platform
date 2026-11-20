"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const image_controller_1 = require("../../controllers/image.controller");
const upload_middleware_1 = __importDefault(require("../../middleware/upload.middleware"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = express_1.default.Router();
router.post("/:productId", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), upload_middleware_1.default.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 },
]), image_controller_1.createImage);
router.get("/:productId", image_controller_1.getImages);
router.patch("/:productImageId", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), upload_middleware_1.default.single("primaryImage"), image_controller_1.updatePrimaryImage);
router.patch("/:productImageId/thumbnails", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), upload_middleware_1.default.array("thumbnails", 5), image_controller_1.updateThumbnails);
router.delete("/:productImageId", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), image_controller_1.deletePrimaryImage);
router.delete("/:productImageId/thumbnail", auth_middleware_1.authenticate, (0, authorize_middleware_1.authorize)("admin"), image_controller_1.deleteThumbnails);
router.use(image_controller_1.uploadError);
exports.default = router;
