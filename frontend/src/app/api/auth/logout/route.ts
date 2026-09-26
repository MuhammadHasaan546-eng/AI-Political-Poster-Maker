import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * POST /api/auth/logout — proxied to the Express backend.
 *
 * The backend clears the httpOnly `token` cookie; `proxyToBackend` mirrors the
 * resulting `Set-Cookie` header back to the browser so the session is fully
 * invalidated server-side (not just cleared in localStorage).
 */
export async function POST(request: Request) {
  return proxyToBackend("/api/auth/logout", forwardInit(request, "POST"));
}
