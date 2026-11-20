"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const env_1 = require("./config/env");
const image_service_1 = require("./services/image.service");
const inventory_service_1 = require("./services/inventory.service");
const startServer = async () => {
    await (0, database_1.default)();
    app_1.default.listen(env_1.env.port, () => {
        console.log(`server running on port ${env_1.env.port}`);
    });
    let cleanupRunning = false;
    const cleanupTimer = setInterval(async () => {
        if (cleanupRunning)
            return;
        cleanupRunning = true;
        try {
            await (0, image_service_1.drainImageCleanup)();
        }
        catch {
            console.warn("Image cleanup worker deferred");
        }
        finally {
            cleanupRunning = false;
        }
    }, 60000);
    cleanupTimer.unref();
    let expiryRunning = false;
    const expiryTimer = setInterval(async () => {
        if (expiryRunning)
            return;
        expiryRunning = true;
        try {
            await (0, inventory_service_1.expireReservations)();
        }
        catch {
            console.warn("Reservation expiry retry deferred");
        }
        finally {
            expiryRunning = false;
        }
    }, 30000);
    expiryTimer.unref();
};
startServer();
