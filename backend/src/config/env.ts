import dotenv from "dotenv";
dotenv.config();

const requiredEnvVariables = ["MONGODB_URI"];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required Enviroment variables ${variable}`);
  }
}
export const env = {
  nodeEnv: process.env.nodeEnv || "development",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI as string,
};
