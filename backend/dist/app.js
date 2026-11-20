"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const not_found_middleware_1 = __importDefault(require("./middleware/not-found.middleware"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const user_routes_1 = __importDefault(require("./utils/routes/user.routes"));
const category_routes_1 = __importDefault(require("./utils/routes/category.routes"));
const brand_routes_1 = __importDefault(require("./utils/routes/brand.routes"));
const product_routes_1 = __importDefault(require("./utils/routes/product.routes"));
const varient_routes_1 = __importDefault(require("./utils/routes/varient.routes"));
const inventory_routes_1 = __importDefault(require("./utils/routes/inventory.routes"));
const imageUploads_route_1 = __importDefault(require("./utils/routes/imageUploads.route"));
const cart_routes_1 = __importDefault(require("./utils/routes/cart.routes"));
const whishList_routes_1 = __importDefault(require("./utils/routes/whishList.routes"));
const address_routes_1 = __importDefault(require("./utils/routes/address.routes"));
const order_routes_1 = __importDefault(require("./utils/routes/order.routes"));
const payment_route_1 = __importDefault(require("./utils/routes/payment.route"));
const ai_routes_1 = __importDefault(require("./utils/routes/ai.routes"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const browser_auth_1 = require("./config/browser-auth");
const api_error_1 = __importDefault(require("./utils/api-error"));
const app = (0, express_1.default)();
const allowedOrigins = browser_auth_1.browserOrigins;
app.use((0, cors_1.default)({
    credentials: true,
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((req, _res, next) => {
    // Cookie credentials are ambient: protect writes, including login/logout,
    // using an explicit trusted Origin. Bearer clients retain their existing API.
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        (req.cookies?.[browser_auth_1.authCookieName] || req.get("X-Auth-Mode") === "cookie") &&
        (!req.get("Origin") || !allowedOrigins.includes(req.get("Origin")))) {
        return next(new api_error_1.default(403, "Untrusted request origin"));
    }
    next();
});
// Liveness only: database and external service readiness are not checked here.
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api/users", user_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/brands", brand_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/varients", varient_routes_1.default);
app.use("/api/inventories", inventory_routes_1.default);
app.use("/api/product-images", imageUploads_route_1.default);
app.use("/api/cart", cart_routes_1.default);
app.use("/api/wishList", whishList_routes_1.default);
app.use("/api/address", address_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/payment", payment_route_1.default);
app.use("/api/ai", ai_routes_1.default);
app.use(not_found_middleware_1.default);
app.use(error_middleware_1.default);
exports.default = app;
