import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Small HTTP helpers shared by all routers.
 *
 * Every response uses the `{ success, data | error }` envelope the frontend
 * expects, so clients can branch on a single discriminator.
 */

/** Send a 2xx success envelope. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

/** Send a 4xx/5xx error envelope. */
export function fail(res: Response, status: number, error: string, code?: string): Response {
  return res.status(status).json({ success: false, error, ...(code ? { code } : {}) });
}

/**
 * Wrap an async handler so rejected promises reach the central error handler
 * instead of becoming unhandled rejections (Express 5 forwards sync throws but
 * this keeps behaviour explicit).
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

/** Coerce an unknown value into a non-empty trimmed string, else `undefined`. */
export function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** True when the value looks like a Mongo ObjectId (accepts Express params). */
export function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}
