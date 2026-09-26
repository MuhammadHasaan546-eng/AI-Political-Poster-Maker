import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * POST /api/posters/:id/regenerate — re-roll a poster (Express backend).
 *
 * The optional `{ overrides: { fontFamily, headlineColor, showMotifs,
 * showFooterBar } }` body is forwarded verbatim so the backend can apply the
 * user's live layer tuning to the regenerated render.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyToBackend(
    `/api/posters/${encodeURIComponent(id)}/regenerate`,
    { ...forwardInit(request, "POST"), body },
  );
}
