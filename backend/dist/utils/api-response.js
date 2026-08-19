"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    success;
    message;
    data;
    constructor(message, data = null) {
        this.success = true;
        this.message = message;
        this.data = data;
    }
}
exports.default = ApiResponse;
