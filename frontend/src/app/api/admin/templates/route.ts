import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/admin/templates — full template library, incl. inactive (admin). */
export async function GET(request: Request) {
  return proxyToBackend("/api/admin/templates", forwardInit(request, "GET"));
}

/** POST /api/admin/templates — create a template (admin only). */
export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/admin/templates", {
    ...forwardInit(request, "POST"),
    body,
  });
}
