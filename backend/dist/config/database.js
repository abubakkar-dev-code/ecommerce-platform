"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDb = async () => {
    try {
        await mongoose_1.default.connect(env_1.env.mongodbUri);
        const topology = await mongoose_1.default.connection.db.admin().command({ hello: 1 });
        if (!topology.setName && topology.msg !== "isdbgrid") {
            throw new Error("Inventory and checkout require a replica set or sharded MongoDB deployment");
        }
        console.log("mongo db connected successfully");
    }
    catch (error) {
        console.log("mongo db connection failed", error.message);
        process.exit(1);
    }
};
exports.default = connectDb;
