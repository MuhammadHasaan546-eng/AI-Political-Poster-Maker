import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * GET /api/admin/posters — moderate every user's posters (admin only).
 * Query params (`status`, `limit`, `offset`) are forwarded verbatim.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  return proxyToBackend(
    `/api/admin/posters${query ? `?${query}` : ""}`,
    forwardInit(request, "GET"),
  );
}
