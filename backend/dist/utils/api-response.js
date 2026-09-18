"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    success;
    message;
    data;
    pagination;
    constructor(message, data = null, pagination = null) {
        this.success = true;
        this.message = message;
        this.data = data;
        this.pagination = pagination;
    }
}
exports.default = ApiResponse;
