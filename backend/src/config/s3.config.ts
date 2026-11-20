import { S3Client } from "@aws-sdk/client-s3";

// Optional integration. Use the SDK's standard region/credential provider chain;
// Cloudinary remains the active upload implementation.
const s3Client = new S3Client({});

export default s3Client;
