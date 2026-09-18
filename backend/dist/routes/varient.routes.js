"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productVariant_controller_1 = require("../controllers/productVariant.controller");
const router = express_1.default.Router();
router.post("/create-varient", productVariant_controller_1.createProductVariant);
router.get("/:id", productVariant_controller_1.getVarient);
router.get("/getSingleVarient/:id", productVariant_controller_1.getVrientById);
router.patch("/:id", productVariant_controller_1.updatevarient);
router.delete("/:id", productVariant_controller_1.deleteVarient);
exports.default = router;
