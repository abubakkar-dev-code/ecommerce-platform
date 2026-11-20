import mongoose from "mongoose";
import app from "./app";
import connectDb from "./config/database";
import { env } from "./config/env";
import { drainImageCleanup } from "./services/image.service";
import { expireReservations } from "./services/inventory.service";
import Cart from "./models/cart.model";
import Order from "./models/order.model";
import Payment from "./models/payment.model";
import Address from "./models/address.model";
import OrderNotification from "./models/orderNotification.model";
import { drainOrderNotifications } from "./services/orderNotification.service";

function schedule(work: () => Promise<void>, delay: number, name: string) {
  let running: Promise<void> | undefined;
  const timer = setInterval(() => {
    running ??= work().catch(() => console.warn("Background task deferred", { task: name }))
      .finally(() => { running = undefined; });
  }, delay);
  timer.unref();
  return async () => {
    clearInterval(timer);
    await running;
  };
}

async function startServer() {
  await connectDb();
  try {
    await Promise.all([Cart.init(), Order.init(), Payment.init(), Address.init(), OrderNotification.init()]);
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
  const server = app.listen(env.port, () => console.info("API listening", { port: env.port }));
  const stopCleanup = schedule(drainImageCleanup, 60_000, "image cleanup");
  const stopExpiry = schedule(expireReservations, 30_000, "reservation expiry");
  const stopNotifications = schedule(drainOrderNotifications, 30_000, "order notifications");
  let closing = false;

  const shutdown = async (exitCode = 0) => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 15_000).unref();
    try {
      await Promise.all([
        new Promise<void>((resolve) => server.close(() => resolve())),
        stopCleanup(),
        stopExpiry(),
        stopNotifications(),
      ]);
      await mongoose.disconnect();
      process.exitCode = exitCode;
    } catch {
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
  server.once("error", () => {
    console.error("API listener failed");
    void shutdown(1);
  });
}

void startServer().catch(() => {
  console.error("API startup failed");
  process.exitCode = 1;
});
