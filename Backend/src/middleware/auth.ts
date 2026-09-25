import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types/auth';
import { USER_ROLES } from '../types/domain';

/** Name of the httpOnly cookie carrying the JWT. */
export const AUTH_COOKIE_NAME = 'token';

/**
 * Minimal cookie-header parser. Avoids a `cookie-parser` dependency while still
 * reading the httpOnly auth cookie set by the auth routes.
 */
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const segment of header.split(';')) {
    const eq = segment.indexOf('=');
    if (eq === -1) continue;
    const key = segment.slice(0, eq).trim();
    if (key === name) {
      return decodeURIComponent(segment.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/** Extract a bearer token from the `Authorization` header, if present. */
function readBearer(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) return token;
  return undefined;
}

/**
 * Verify a JWT and coerce the payload into an {@link AuthUser}.
 * Returns `undefined` for any malformed / expired token.
 */
export function verifyToken(token: string): AuthUser | undefined {
  if (!env.JWT_SECRET) return undefined;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null) return undefined;

    const record = decoded as Record<string, unknown>;
    const sub = record['sub'];
    const email = record['email'];
    const role = record['role'];

    if (typeof sub !== 'string' || typeof email !== 'string') return undefined;
    if (typeof role !== 'string' || !USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
      return undefined;
    }

    return { id: sub, email, role: role as AuthUser['role'] };
  } catch {
    return undefined;
  }
}

/**
 * Require authentication. Reads the httpOnly cookie first, then falls back to
 * `Authorization: Bearer <token>`. Attaches the principal to `req.user`.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token = readBearer(req) ?? readCookie(req, AUTH_COOKIE_NAME);

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid or expired session.' });
    return;
  }

  req.user = user;
  next();
};

/**
 * Attach `req.user` when a valid token is present, but never reject.
 * Useful for endpoints with optional personalisation.
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = readBearer(req) ?? readCookie(req, AUTH_COOKIE_NAME);
  if (token) {
    const user = verifyToken(token);
    if (user) req.user = user;
  }
  next();
};
