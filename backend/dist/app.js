"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const not_found_middleware_1 = __importDefault(require("./middleware/not-found.middleware"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/users", user_routes_1.default);
app.use(not_found_middleware_1.default);
app.use(error_middleware_1.default);
exports.default = app;
