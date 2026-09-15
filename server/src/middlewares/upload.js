import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/apiResponse.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// Magic bytes, checked against the declared MIME type. A client can claim any
// content type it likes, so the declaration alone is not a control.
const SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

export const detectMime = (buffer) =>
  SIGNATURES.find(({ bytes }) => bytes.every((byte, index) => buffer[index] === byte))?.mime ?? null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return callback(
        AppError.badRequest('Upload a JPG, PNG, WebP or PDF file.', 'UNSUPPORTED_FILE_TYPE'),
      );
    }
    return callback(null, true);
  },
});

export const uploadSingleFile = (field = 'file') => (req, res, next) =>
  upload.single(field)(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, {
        status: 413,
        message: `That file is too large. The limit is ${Math.round(env.MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
        code: 'FILE_TOO_LARGE',
      });
    }

    return next(error);
  });
