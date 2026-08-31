import dotenv from "dotenv";
dotenv.config();

const requiredEnvVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "CLIENT_CALLBACK_URI",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USER",
  "MAIL_PASSWORD",
  "MAIL_FROM",
  "AWS_ACCESS_KEYAWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET_NAME",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required Enviroment variables ${variable}`);
  }
}
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  CLIENT_CALLBACK_URI: process.env.CLIENT_CALLBACK_URI,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM,
  AWS_ACCESS_KEYAWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEYAWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
};
