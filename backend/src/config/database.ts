import mongoose from "mongoose";
import { env } from "./env";


const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log("mongo db connected successfully");
  } catch (error) {
    console.log("mongo db connection failed", (error as Error).message);
    process.exit(1)
  }
};

export default connectDb
