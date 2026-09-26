import { Router } from 'express';
import type { Response } from 'express';
import { env } from '../config/env';
import { AUTH_COOKIE_NAME, requireAuth } from '../middleware/auth';
import { asyncHandler, fail, ok } from '../lib/http';
import { loginSchema, registerSchema } from '../validations/schemas';
import { findUserById, loginUser, registerUser, toPublicUser } from '../services/auth';

/** Authentication routes: register, login, logout, current user. */
const router = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Set the httpOnly auth cookie alongside the JSON token response. */
function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR');
    }

    const { user, token } = await registerUser(parsed.data);
    setAuthCookie(res, token);
    return ok(res, user, 201);
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message ?? 'Invalid input.', 'VALIDATION_ERROR');
    }

    const { user, token } = await loginUser(parsed.data);
    setAuthCookie(res, token);
    return ok(res, user);
  }),
);

router.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  return ok(res, { loggedOut: true });
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const doc = await findUserById(req.user!.id);
    if (!doc) return fail(res, 404, 'User not found.', 'NOT_FOUND');
    return ok(res, toPublicUser(doc));
  }),
);

export default router;
