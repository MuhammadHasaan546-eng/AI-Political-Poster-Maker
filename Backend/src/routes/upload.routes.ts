import { Router } from 'express';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { uploadPhotos } from '../middleware/upload';
import { asyncHandler, fail, ok } from '../lib/http';
import { createStorage } from '../services/storage';

/** Authenticated photo upload endpoint. */
const router = Router();

router.post(
  '/',
  requireAuth,
  (req, res, next) => {
    // Run multer manually so its errors are normalised into the API envelope.
    uploadPhotos(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        fail(res, 400, message, 'UPLOAD_ERROR');
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      return fail(res, 422, 'Please upload at least one photo.', 'NO_FILES');
    }

    const storage = createStorage();
    const results = await Promise.all(
      files.map((file) =>
        storage.upload(file.buffer, {
          folder: `${env.CLOUDINARY_FOLDER}/uploads`,
          filename: file.originalname.replace(/\.[^.]+$/, ''),
          mimeType: file.mimetype,
          tags: ['upload'],
        }),
      ),
    );

    return ok(res, results, 201);
  }),
);

export default router;
