import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/templates — proxied to the Express backend template library. */
export async function GET(request: Request) {
  return proxyToBackend("/api/templates", forwardInit(request, "GET"));
}
