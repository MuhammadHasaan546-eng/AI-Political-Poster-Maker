import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * GET /api/auth/me — proxied to the Express backend.
 *
 * The browser's httpOnly `token` cookie is forwarded by `forwardInit`, so the
 * backend resolves the current principal. A 401 is passed through verbatim,
 * which the client treats as "no active session".
 */
export async function GET(request: Request) {
  return proxyToBackend("/api/auth/me", forwardInit(request, "GET"));
}
