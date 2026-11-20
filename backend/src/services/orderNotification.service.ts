import { randomUUID } from "node:crypto";
import type { ClientSession, Types } from "mongoose";
import OrderNotification from "../models/orderNotification.model";
import User from "../models/user.model";
import transporter from "../config/email";
import { env } from "../config/env";

type NotificationType = "cod_confirmed" | "confirmed" | "payment_review" | "cancelled";
const labels: Record<NotificationType, string> = {
  cod_confirmed: "Your Cash on Delivery order was placed. Payment is due on delivery.",
  confirmed: "Payment was confirmed and your order has been received.",
  payment_review: "We received payment and are reviewing your order.",
  cancelled: "Your order was cancelled.",
};
const maxAttempts = 6;

export async function queueOrderNotification(order: Types.ObjectId, user: Types.ObjectId | string, type: NotificationType, session: ClientSession) {
  if (process.env.ORDER_EMAIL_ENABLED !== "true") return;
  await OrderNotification.updateOne({ _id: `${order}:${type}` },
    { $setOnInsert: { order, user, type } }, { upsert: true, session });
}

export async function drainOrderNotifications() {
  if (process.env.ORDER_EMAIL_ENABLED !== "true") return;
  for (let attempt = 0; attempt < 10; attempt++) {
    const now = new Date();
    const leaseId = randomUUID();
    const job = await OrderNotification.findOneAndUpdate({
      status: "pending", nextAttemptAt: { $lte: now },
      $or: [{ leaseUntil: { $lte: now } }, { leaseUntil: { $exists: false } }],
    }, { $set: { leaseId, leaseUntil: new Date(Date.now() + 120_000) }, $inc: { attempts: 1 } },
    { sort: { nextAttemptAt: 1 }, returnDocument: "after" });
    if (!job) return;
    try {
      const user = await User.findById(job.user).select("email isActive emailVerifiedAt").lean();
      const label = labels[job.type as NotificationType];
      const deliver = user?.isActive && user.emailVerifiedAt;
      if (deliver) {
        await transporter.sendMail({
          from: env.MAIL_FROM, to: user.email,
          subject: `Nexora order ${job.order}`,
          text: `${label}\n\nOpen your Nexora order history for details.`,
        });
      }
      await OrderNotification.updateOne({ _id: job._id, leaseId }, {
        $set: { status: deliver ? "sent" : "skipped" }, $unset: { leaseId: "", leaseUntil: "" },
      });
    } catch {
      const exhausted = job.attempts >= maxAttempts;
      await OrderNotification.updateOne({ _id: job._id, leaseId }, {
        $set: { status: exhausted ? "failed" : "pending", nextAttemptAt: new Date(Date.now() + 60_000 * 2 ** (job.attempts - 1)) },
        $unset: { leaseId: "", leaseUntil: "" },
      });
      if (exhausted) console.warn("Order notification exhausted its retries", { type: job.type });
    }
  }
}
