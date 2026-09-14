import express from "express";
import notFound from "./middleware/not-found.middleware";
import errorMiddleware from "./middleware/error.middleware";
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";
import productRoutes from "./routes/product.routes";
import varientRoutes from "./routes/varient.routes";
import inventoryRoutes from "./routes/inventory.routes";
import imageRoutes from "./routes/imageUploads.route";
import cartRoutes from "./routes/cart.routes";
import wishRoutes from "./routes/whishList.routes";
import addressRoutes from "./routes/address.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.route";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/varients", varientRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/product-images", imageRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishList", wishRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use(notFound);
app.use(errorMiddleware);
export default app;
