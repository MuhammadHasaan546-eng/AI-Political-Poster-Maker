import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/** POST /api/auth/login — proxied to the Express backend. */
export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend("/api/auth/login", {
    ...forwardInit(request, "POST"),
    body,
  });
}
