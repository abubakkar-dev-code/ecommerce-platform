import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (userId: string, sessionId?: string): string => {
  return jwt.sign({ userId, ...(sessionId ? { sessionId } : {}) }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};
