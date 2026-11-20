import mongoose from "mongoose";
import { env } from "./env";

export default async function connectDb() {
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10_000 });
  try {
    const topology = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (!topology.setName && topology.msg !== "isdbgrid") {
      throw new Error("A replica set or sharded MongoDB deployment is required");
    }
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
  console.info("MongoDB connected");
}
