import express from "express";
import notFound from "./middleware/not-found.middleware";
import errorMiddleware from "./middleware/error.middleware";
import healthRoutes from "./routes/checkRoutes";

const app = express();
app.use(express.json());
app.use("/api/health", healthRoutes);
app.use(notFound);
app.use(errorMiddleware);
export default app;
