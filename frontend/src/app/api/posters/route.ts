import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** GET /api/posters — the caller's poster history (Express backend). */
export async function GET(request: Request) {
  return proxyToBackend("/api/posters", forwardInit(request, "GET"));
}

/** POST /api/posters — create a generation job (Express backend). */
export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/posters", {
    ...forwardInit(request, "POST"),
    body,
  });
}
