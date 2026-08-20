import express from "express";
import notFound from "./middleware/not-found.middleware";
import errorMiddleware from "./middleware/error.middleware";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/categories", productRoutes);
app.use("/api/brands", brandRoutes);
app.use(notFound);
app.use(errorMiddleware);
export default app;
