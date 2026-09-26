import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** POST /api/posters/analyze — AI layout suggestions (Express backend). */
export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/posters/analyze", {
    ...forwardInit(request, "POST"),
    body,
  });
}
