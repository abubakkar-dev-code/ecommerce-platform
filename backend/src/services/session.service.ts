import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { authCookieName, authCookieOptions } from "../config/browser-auth";
import Session from "../models/session.model";
import User from "../models/user.model";
import ApiError from "../utils/api-error";
import { generateToken } from "../utils/jwt";

export const refreshCookieName = "refresh_token";
const refreshOptions = { ...authCookieOptions, path: "/api/users" };
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const objectId = /^[a-f\d]{24}$/i;
const invalidSession = () => new ApiError(401, "Session expired. Sign in again.");

function issueRefresh(sessionId: string, userId: string, expiresAt: Date) {
  return jwt.sign({
    sessionId, exp: Math.floor(expiresAt.getTime() / 1000),
  }, env.JWT_SECRET, { algorithm: "HS256", audience: "nexora-refresh", subject: userId, jwtid: randomUUID() });
}

function readRefresh(value: unknown) {
  if (typeof value !== "string") return;
  try {
    const payload = jwt.verify(value, env.JWT_SECRET, { algorithms: ["HS256"], audience: "nexora-refresh" });
    if (typeof payload !== "string" && typeof payload.sub === "string" && objectId.test(payload.sub)
      && typeof payload.sessionId === "string" && objectId.test(payload.sessionId) && typeof payload.exp === "number") {
      return { userId: payload.sub, sessionId: payload.sessionId, expiresAt: new Date(payload.exp * 1000), value };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function setCookies(res: Response, userId: string, sessionId: string, refresh: string, expiresAt: Date) {
  res.setHeader("Cache-Control", "no-store");
  res.cookie(authCookieName, generateToken(userId, sessionId), authCookieOptions);
  res.cookie(refreshCookieName, refresh, { ...refreshOptions, expires: expiresAt });
}

export async function startSession(userId: string, res: Response) {
  const id = new Types.ObjectId();
  const expiresAt = new Date(Date.now() + sessionLifetime);
  const refresh = issueRefresh(String(id), userId, expiresAt);
  await Session.create({ _id: id, user: userId, expiresAt, refreshHash: hash(refresh) });
  setCookies(res, userId, String(id), refresh, expiresAt);
}

export async function rotateSession(req: Request, res: Response) {
  const credential = readRefresh(req.cookies?.[refreshCookieName]);
  if (!credential) throw invalidSession();
  const { userId, sessionId, expiresAt, value } = credential;
  const user = await User.findById(userId);
  if (!user || user.isActive !== true) {
    await revokeSession(sessionId, userId);
    throw invalidSession();
  }
  const refresh = issueRefresh(sessionId, userId, expiresAt);
  const updated = await Session.updateOne({
    _id: sessionId, user: userId, revokedAt: null, expiresAt: { $gt: new Date() }, refreshHash: hash(value),
  }, { $set: { refreshHash: hash(refresh) } });
  if (updated.matchedCount !== 1) {
    await revokeSession(sessionId, userId);
    throw invalidSession();
  }
  setCookies(res, userId, sessionId, refresh, expiresAt);
  return user;
}

export async function revokeSession(sessionId: string, userId: string) {
  await Session.updateOne({ _id: sessionId, user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: string) {
  await Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function logoutSession(req: Request) {
  const credential = readRefresh(req.cookies?.[refreshCookieName]);
  if (credential) {
    await revokeSession(credential.sessionId, credential.userId);
    return;
  }
  try {
    const token = req.cookies?.[authCookieName];
    if (typeof token !== "string") return;
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"], ignoreExpiration: true });
    if (typeof payload !== "string" && typeof payload.sessionId === "string" && objectId.test(payload.sessionId)
        && typeof payload.userId === "string" && objectId.test(payload.userId)) {
      await revokeSession(payload.sessionId, payload.userId);
    }
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError)) throw error;
  }
}

export function clearSessionCookies(res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.clearCookie(authCookieName, authCookieOptions);
  res.clearCookie(refreshCookieName, refreshOptions);
}
