import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/templates/:id — proxied to the Express backend. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(`/api/templates/${encodeURIComponent(id)}`, forwardInit(request, "GET"));
}
