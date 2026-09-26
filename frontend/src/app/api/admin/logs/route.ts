import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/admin/logs — recent generation telemetry (admin only). */
export async function GET(request: Request) {
  return proxyToBackend("/api/admin/logs", forwardInit(request, "GET"));
}
