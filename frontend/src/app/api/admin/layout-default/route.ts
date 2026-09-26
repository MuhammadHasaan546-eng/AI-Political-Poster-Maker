import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/admin/layout-default — baseline layout for scaffolding (admin). */
export async function GET(request: Request) {
  return proxyToBackend("/api/admin/layout-default", forwardInit(request, "GET"));
}
