import { forwardInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * POST /api/upload — proxied to the Express backend.
 *
 * The raw multipart body is buffered and forwarded verbatim, so the backend's
 * multer middleware can parse it exactly as if it received the request
 * directly. `content-type` (with its multipart boundary) is preserved by
 * `forwardInit`.
 */
export async function POST(request: Request) {
  const body = await request.arrayBuffer();
  return proxyToBackend("/api/upload", {
    ...forwardInit(request, "POST"),
    body,
  });
}
