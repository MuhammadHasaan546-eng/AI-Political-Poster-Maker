import mongoose from 'mongoose';
import { env } from './env';

/**
 * Lazy import so that `mongodb-memory-server` (a devDependency, ~large) is only
 * loaded when in-memory mode is actually requested.
 */
type MemoryServer = {
  getUri: () => string;
  stop: () => Promise<boolean>;
};

let memoryServer: MemoryServer | null = null;
let connected = false;

/**
 * Connect to MongoDB.
 *
 * - If `MONGODB_URI` is set, connect to it (Atlas or local).
 * - Else if `DEV_IN_MEMORY_DB=true`, boot `mongodb-memory-server` and connect —
 *   with a LOUD warning that data is discarded on restart.
 * - Else, log a clear warning and return without connecting (server keeps serving).
 */
export async function connectDatabase(): Promise<void> {
  if (connected) return;

  mongoose.set('strictQuery', true);

  try {
    if (env.HAS_MONGODB_URI && env.MONGODB_URI) {
      await mongoose.connect(env.MONGODB_URI);
      connected = true;
      console.log('[db] Connected to MongoDB via MONGODB_URI.');
      return;
    }

    if (env.DEV_IN_MEMORY_DB) {
      console.warn('============================================================');
      console.warn('[db] DEV_IN_MEMORY_DB=true -> starting an IN-MEMORY MongoDB.');
      console.warn('[db] !! ALL DATA IS EPHEMERAL AND WILL BE DISCARDED ON RESTART !!');
      console.warn('============================================================');

      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = (await MongoMemoryServer.create()) as unknown as MemoryServer;
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      connected = true;
      console.log('[db] Connected to in-memory MongoDB.');
      return;
    }

    console.warn(
      '[db] WARNING: No MONGODB_URI and DEV_IN_MEMORY_DB is false. ' +
        'Database features are DISABLED; the API will start without persistence.',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] Failed to connect to MongoDB: ${message}`);
    console.warn('[db] Continuing without a database connection (degraded mode).');
  }
}

/** True when a mongoose connection is established. */
export function isDatabaseConnected(): boolean {
  return connected && mongoose.connection.readyState === 1;
}

/** Close the mongoose connection and stop any in-memory server. */
export async function disconnectDatabase(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] Error while disconnecting mongoose: ${message}`);
  }

  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[db] Error while stopping in-memory MongoDB: ${message}`);
    }
    memoryServer = null;
  }

  connected = false;
}
