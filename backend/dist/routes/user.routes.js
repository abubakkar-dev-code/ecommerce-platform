"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const passport_1 = __importDefault(require("../config/passport"));
const router = express_1.default.Router();
router.post("/register", user_controller_1.registerUser);
router.post("/login", user_controller_1.loginUser);
router.get("/profile", auth_middleware_1.authenticate, user_controller_1.userProfile);
router.put("/update-profile", auth_middleware_1.authenticate, user_controller_1.updateProfile);
router.put("/update-password", auth_middleware_1.authenticate, user_controller_1.updatePassword);
router.get("/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
}));
router.get("/google/callback", passport_1.default.authenticate("google", {
    session: false,
}), user_controller_1.googleCallback);
exports.default = router;
