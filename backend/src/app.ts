import express from "express";
import notFound from "./middleware/not-found.middleware";
import errorMiddleware from "./middleware/error.middleware";
import userRoutes from "./utils/routes/user.routes";
import categoryRoutes from "./utils/routes/category.routes";
import brandRoutes from "./utils/routes/brand.routes";
import productRoutes from "./utils/routes/product.routes";
import varientRoutes from "./utils/routes/varient.routes";
import inventoryRoutes from "./utils/routes/inventory.routes";
import imageRoutes from "./utils/routes/imageUploads.route";
import cartRoutes from "./utils/routes/cart.routes";
import wishRoutes from "./utils/routes/whishList.routes";
import addressRoutes from "./utils/routes/address.routes";
import orderRoutes from "./utils/routes/order.routes";
import adminOrderRoutes from "./utils/routes/adminOrder.routes";
import adminCatalogRoutes from "./utils/routes/adminCatalog.routes";
import paymentRoutes from "./utils/routes/payment.route";
import aiRoutes from "./utils/routes/ai.routes";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import { paymentWebhook } from "./controllers/payment.controller";
import { refreshCookieName } from "./services/session.service";
import cookieParser from "cookie-parser";
import { browserOrigins, authCookieName } from "./config/browser-auth";
import ApiError from "./utils/api-error";

const app = express();
const allowedOrigins = browserOrigins;
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(helmet());
app.post("/api/payment/webhook", express.raw({ type: "application/json", limit: "100kb" }), paymentWebhook);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use((req, _res, next) => {
  // Cookie credentials are ambient: protect writes, including login/logout,
  // using an explicit trusted Origin. Bearer clients retain their existing API.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.cookies?.[authCookieName] || req.cookies?.[refreshCookieName] || req.get("X-Auth-Mode") === "cookie") &&
      (!req.get("Origin") || !allowedOrigins.includes(req.get("Origin")!))) {
    return next(new ApiError(403, "Untrusted request origin"));
  }
  next();
});

// Liveness only: database and external service readiness are not checked here.
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
});

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
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin", adminCatalogRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use(notFound);
app.use(errorMiddleware);
export default app;
