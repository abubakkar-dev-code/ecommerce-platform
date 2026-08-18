import dotenv from "dotenv";
dotenv.config();

const requiredEnvVariables = ["MONGODB_URI", "JWT_SECRET", "JWT_EXPIRES_IN"];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required Enviroment variables ${variable}`);
  }
}
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  port:process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
};
