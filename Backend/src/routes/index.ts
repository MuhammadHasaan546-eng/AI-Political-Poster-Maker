import { Router } from 'express';
import { ok } from '../lib/http';
import adminRouter from './admin.routes';
import authRouter from './auth.routes';
import postersRouter from './posters.routes';
import templatesRouter from './templates.routes';
import uploadRouter from './upload.routes';

/** Aggregate API router mounted at `/api`. */
const router = Router();

router.get('/', (_req, res) =>
  ok(res, { name: 'AI Political Poster Maker API', version: '1.0.0' }),
);

router.use('/auth', authRouter);
router.use('/templates', templatesRouter);
router.use('/posters', postersRouter);
router.use('/upload', uploadRouter);
router.use('/admin', adminRouter);

export default router;
