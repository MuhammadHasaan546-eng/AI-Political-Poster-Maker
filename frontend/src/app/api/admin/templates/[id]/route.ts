import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/admin/templates/:id — read one template (admin only). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(
    `/api/admin/templates/${encodeURIComponent(id)}`,
    forwardInit(request, "GET"),
  );
}

/** PATCH /api/admin/templates/:id — update a template (admin only). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyToBackend(`/api/admin/templates/${encodeURIComponent(id)}`, {
    ...forwardInit(request, "PATCH"),
    body,
  });
}

/** DELETE /api/admin/templates/:id — soft-delete a template (admin only). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(
    `/api/admin/templates/${encodeURIComponent(id)}`,
    forwardInit(request, "DELETE"),
  );
}
