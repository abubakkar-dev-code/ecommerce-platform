"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    statusCode;
    success;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.default = ApiError;
