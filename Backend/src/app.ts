import path from 'node:path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { isDatabaseConnected } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { STORAGE_ROOT } from './services/storage';

/**
 * Build and configure the Express application.
 *
 * Registers the health probe, the versioned API router and (for the local
 * storage driver) a static mount that serves generated posters back to clients.
 */
export function createApp(): express.Express {
  const app = express();

  const allowedOrigins = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      env: env.NODE_ENV,
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
      storage: env.HAS_CLOUDINARY ? 'cloudinary' : 'local-disk',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Locally stored assets (no-op for Cloudinary, which serves its own CDN URLs).
  app.use(
    '/storage',
    express.static(path.resolve(STORAGE_ROOT), {
      maxAge: '1h',
      fallthrough: true,
      index: false,
    }),
  );

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
