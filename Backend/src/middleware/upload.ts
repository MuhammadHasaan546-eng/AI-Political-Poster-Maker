import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { env } from '../config/env';

/** Maximum number of photo uploads accepted per request. */
export const MAX_UPLOAD_FILES = 3;

const MB = 1024 * 1024;

/** Multer instance configured for in-memory image uploads with guardrails. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * MB,
    files: MAX_UPLOAD_FILES,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed.'));
  },
});

/** Ready-to-use middleware accepting up to {@link MAX_UPLOAD_FILES} `photos`. */
export const uploadPhotos = upload.array('photos', MAX_UPLOAD_FILES);

export default upload;
