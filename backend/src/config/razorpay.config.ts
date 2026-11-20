import { z } from "zod";
import { env } from "./env";
import ApiError from "../utils/api-error";

const origin = "https://api.razorpay.com/v1";
const orderResponse = z.object({
  id: z.string().regex(/^order_[a-zA-Z\d]+$/),
  amount: z.number().int(),
  currency: z.literal("INR"),
});

async function request(path: string, body?: object): Promise<unknown> {
  const authorization = Buffer.from(`${env.RAZOR_PAY_KEY}:${env.RAZOR_PAY_SECRET}`).toString("base64");
  try {
    const response = await fetch(origin + path, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Basic ${authorization}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body && JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return await response.json();
  } catch {
    throw new ApiError(502, "Payment provider is unavailable");
  }
  throw new ApiError(502, "Payment provider rejected the request");
}

export default {
  orders: {
    async create(input: { amount: number; currency: "INR"; receipt: string }) {
      const result = orderResponse.safeParse(await request("/orders", input));
      if (!result.success || result.data.amount !== input.amount) {
        throw new ApiError(502, "Payment provider returned an unexpected order");
      }
      return result.data;
    },
  },
  payments: {
    fetch: (id: string) => request("/payments/" + encodeURIComponent(id)),
  },
};
