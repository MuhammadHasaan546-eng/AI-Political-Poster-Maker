import type { ErrorRequestHandler, RequestHandler } from 'express';

/** An error carrying an HTTP status (and optional machine-readable code). */
export class HttpError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

interface NormalisedError {
  status: number;
  message: string;
  code?: string;
}

function extractStatus(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number' && status >= 400 && status < 600) return status;
  }
  return undefined;
}

function extractName(err: unknown): string {
  if (err instanceof Error) return err.name;
  return 'Error';
}

function normalise(err: unknown): NormalisedError {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message, code: err.code };
  }

  const status = extractStatus(err);
  const name = extractName(err);
  const message = err instanceof Error ? err.message : 'Unexpected server error.';

  if (name === 'ValidationError') {
    return { status: 400, message };
  }
  if (name === 'CastError') {
    return { status: 400, message: 'Invalid identifier or value.' };
  }
  // Body-parser / express.json malformed JSON.
  if (err instanceof SyntaxError && status === 400) {
    return { status: 400, message: 'Malformed JSON in request body.' };
  }

  return { status: status ?? 500, message };
}

/** 404 fallthrough for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/** Central JSON error handler — must be registered last. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { status, message, code } = normalise(err);

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error.' : message,
    ...(code ? { code } : {}),
  });
};
