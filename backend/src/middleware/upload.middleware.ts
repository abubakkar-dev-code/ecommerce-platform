import multer from "multer";
import ApiError from "../utils/api-error";

// Buffer only after route authentication/authorization; no provider calls here.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) callback(null, true);
    else callback(new ApiError(400, "Only JPEG, PNG and WebP images are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 6, fields: 2, fieldSize: 512, parts: 8 },
});
export default upload;
