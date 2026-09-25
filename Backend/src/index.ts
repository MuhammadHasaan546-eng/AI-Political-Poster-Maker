import { createApp } from './app';
import { env, logEnvWarnings } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { closeBrowser } from './services/render';
import { ensureStorageReady } from './services/storage';

/**
 * Application bootstrap.
 *
 * Order of operations:
 *  1. Emit non-fatal env warnings (never throws on missing credentials).
 *  2. Attempt a database connection (gracefully degrades if unavailable).
 *  3. Prepare the storage driver (creates the local disk directory).
 *  4. Start the HTTP server.
 *  5. Register graceful shutdown handlers (server, DB, headless Chrome).
 */
async function bootstrap(): Promise<void> {
  logEnvWarnings();
  await connectDatabase();
  await ensureStorageReady();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[server] ${signal} received — shutting down.`);
    server.close(() => {
      void Promise.allSettled([disconnectDatabase(), closeBrowser()]).finally(() =>
        process.exit(0),
      );
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap();
