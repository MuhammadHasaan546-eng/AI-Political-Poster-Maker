import type { AuthUser } from './auth';

/**
 * Augments Express's `Request` so `req.user` is typed after `requireAuth`.
 * This file has no runtime output; it only contributes global types.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
