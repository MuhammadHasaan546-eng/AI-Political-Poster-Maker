import type { UserRole } from './domain';

/** The authenticated principal attached to `req.user` by `requireAuth`. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/** Shape of the JWT we issue and verify. */
export interface JwtPayload {
  /** Subject: the user id. */
  sub: string;
  email: string;
  role: UserRole;
  /** Issued-at (seconds since epoch), added by the JWT library. */
  iat?: number;
  /** Expiry (seconds since epoch), added by the JWT library. */
  exp?: number;
}
