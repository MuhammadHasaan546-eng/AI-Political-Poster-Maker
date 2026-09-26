import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** DELETE /api/admin/posters/:id — remove any user's poster (admin only). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(
    `/api/admin/posters/${encodeURIComponent(id)}`,
    forwardInit(request, "DELETE"),
  );
}
