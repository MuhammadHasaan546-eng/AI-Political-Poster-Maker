import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/admin/stats — aggregated platform telemetry (admin only). */
export async function GET(request: Request) {
  return proxyToBackend("/api/admin/stats", forwardInit(request, "GET"));
}
