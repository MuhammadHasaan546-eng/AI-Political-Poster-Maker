import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** POST /api/admin/templates/seed — re-seed built-in templates (admin only). */
export async function POST(request: Request) {
  return proxyToBackend("/api/admin/templates/seed", forwardInit(request, "POST"));
}
