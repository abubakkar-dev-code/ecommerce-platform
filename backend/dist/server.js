"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const env_1 = require("./config/env");
const startServer = async () => {
    await (0, database_1.default)();
    app_1.default.listen(env_1.env.port, () => {
        console.log(`server running on port ${env_1.env.port}`);
    });
};
startServer();
