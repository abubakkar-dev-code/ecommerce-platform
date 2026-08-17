import app from "./app";
import connectDb from "./config/database";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`server running on port ${env.port}`);
  });
};
startServer()