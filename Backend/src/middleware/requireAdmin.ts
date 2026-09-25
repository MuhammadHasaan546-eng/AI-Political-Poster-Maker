import type { RequestHandler } from 'express';
import { requireAuth } from './auth';

/**
 * Require an authenticated user with the `admin` role.
 * Runs {@link requireAuth} first, then enforces the role check.
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, (err?: unknown) => {
    if (err) {
      next(err);
      return;
    }
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Administrator privileges required.' });
      return;
    }
    next();
  });
};
