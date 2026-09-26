import { credentialsInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * GET /api/auth/me — proxied to the Express backend.
 *
 * The browser's httpOnly `token` cookie is forwarded so the backend resolves
 * the current principal. A 401 is passed through verbatim, which the client
 * treats as "no active session". This is the session of record used to
 * rehydrate the UI on every page load.
 */
export async function GET(request: Request) {
  const { init, cookies } = credentialsInit(request, "GET");
  return proxyToBackend("/api/auth/me", init, { cookies });
}
