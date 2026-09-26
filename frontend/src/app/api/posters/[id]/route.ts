import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/posters/:id — poll a single poster (Express backend). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(`/api/posters/${encodeURIComponent(id)}`, forwardInit(request, "GET"));
}

/** DELETE /api/posters/:id — remove a poster from history (Express backend). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(`/api/posters/${encodeURIComponent(id)}`, forwardInit(request, "DELETE"));
}
