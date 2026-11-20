"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
// Optional integration. Use the SDK's standard region/credential provider chain;
// Cloudinary remains the active upload implementation.
const s3Client = new client_s3_1.S3Client({});
exports.default = s3Client;
