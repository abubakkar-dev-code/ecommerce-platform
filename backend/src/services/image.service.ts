import { randomUUID } from "node:crypto";
import sharp from "sharp";
import cloudinary from "../config/cloudinary";
import ProductImage from "../models/productImageSchema";
import ImageAsset from "../models/imageAsset.model";
import ApiError from "../utils/api-error";

export interface UploadedImage { url: string; publicId: string }
export const validateImage = async (file: Express.Multer.File): Promise<Buffer> => {
  if (!file.buffer || file.buffer.length > 5 * 1024 * 1024) throw new ApiError(400, "Image exceeds size limit");
  try {
    const image = sharp(file.buffer, { failOn: "warning", limitInputPixels: 16_000_000 });
    const metadata = await image.metadata();
    const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    if (!metadata.format || !(metadata.format in mime) || mime[metadata.format as keyof typeof mime] !== file.mimetype
      || !metadata.width || !metadata.height || metadata.width > 8192 || metadata.height > 8192 || (metadata.pages ?? 1) !== 1) {
      throw new Error("Invalid image");
    }
    // Decode fully and re-encode: metadata-only inspection does not validate pixels.
    const buffer = await image.rotate().webp({ quality: 90 }).toBuffer();
    if (buffer.length > 5 * 1024 * 1024) throw new Error("Encoded image too large");
    return buffer;
  } catch { throw new ApiError(400, "Expected a valid, non-animated JPEG, PNG or WebP within image limits"); }
};

export const uploadImage = async (buffer: Buffer, journal: string[]): Promise<UploadedImage> => {
  const publicId = "nexora/products/" + randomUUID();
  await ImageAsset.create({ publicId, state: "pending", retryAfter: new Date(Date.now() + 60 * 60 * 1000) });
  journal.push(publicId);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ public_id: publicId, resource_type: "image", overwrite: false, timeout: 60000 }, (error, result) => {
      if (error || !result?.secure_url || result.public_id !== publicId) reject(new ApiError(502, "Image upload failed"));
      else resolve({ url: result.secure_url, publicId });
    });
    stream.on("error", () => reject(new ApiError(502, "Image upload failed")));
    stream.end(buffer);
  });
};

export const markAttached = async (ids: string[]): Promise<void> => {
  try { await ImageAsset.updateMany({ publicId: { $in: ids } }, { $set: { state: "attached", lockedUntil: null } }); }
  catch { console.warn("Image journal finalization deferred"); }
};
export const queueCleanup = async (ids: string[], delayMs = 0, strict = false): Promise<void> => {
  for (const publicId of new Set(ids.filter(Boolean))) {
    try {
      await ImageAsset.updateOne({ publicId }, { $set: { state: "cleanup", retryAfter: new Date(Date.now() + delayMs) }, $setOnInsert: { attempts: 0 } }, { upsert: true });
    } catch (error) { if (strict) throw error; console.warn("Image cleanup journal update deferred"); }
  }
};

export const drainImageCleanup = async (): Promise<void> => {
  // Database outage fails closed: never delete an asset whose references cannot be checked.
  for (let i = 0; i < 25; i++) {
    const now = new Date();
    const asset = await ImageAsset.findOneAndUpdate({ state: { $in: ["pending", "cleanup"] }, retryAfter: { $lte: now },
      $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }] },
    { $set: { lockedUntil: new Date(Date.now() + 60000) } }, { returnDocument: "after", sort: { retryAfter: 1 } });
    if (!asset) return;
    try {
      const referenced = await ProductImage.exists({ $or: [{ primaryPublicId: asset.publicId }, { "thumbnails.publicId": asset.publicId }] });
      if (referenced) {
        asset.state = "attached";
        asset.lockedUntil = null;
        await asset.save();
        continue;
      }
      const result = await cloudinary.uploader.destroy(asset.publicId, { resource_type: "image", invalidate: true });
      if (!["ok", "not found"].includes(result.result)) throw new Error("Cleanup was not confirmed");
      await ImageAsset.deleteOne({ _id: asset._id });
    } catch {
      await ImageAsset.updateOne({ _id: asset._id }, { $inc: { attempts: 1 }, $set: {
        retryAfter: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(asset.attempts, 6))), lockedUntil: null,
      } });
    }
  }
};
export const cleanupImages = async (ids: string[]): Promise<void> => {
  await queueCleanup(ids);
  try { await drainImageCleanup(); } catch { console.warn("Image cleanup retry deferred"); }
};
