import { proxyToBackend } from "@/lib/server-proxy";

/**
 * GET /storage/* — same-origin proxy for backend-served assets.
 *
 * Generated posters and uploaded photos are written to the backend's local
 * `storage/` directory and exposed at `PUBLIC_BASE_URL/storage/...` (typically
 * `http://localhost:5000/storage/...`). Serving them from the frontend origin
 * keeps them first-party, so:
 *   - `<img>`/`<canvas>` rendering never trips cross-origin tainting, and
 *   - the persisted URLs returned by the API are reachable regardless of how
 *     the backend host is exposed to the browser.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const suffix = path.map((segment) => encodeURIComponent(segment)).join("/");
  return proxyToBackend(`/storage/${suffix}`, { method: "GET" });
}
