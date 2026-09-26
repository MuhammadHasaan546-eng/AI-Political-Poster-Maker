import { credentialsInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * POST /api/auth/login — proxied to the Express backend.
 *
 * The backend's `Set-Cookie` is re-asserted to the browser via
 * `proxyToBackend` so the cross-site session persists on Vercel.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const { init, cookies } = credentialsInit(request, "POST");
  return proxyToBackend(
    "/api/auth/login",
    { ...init, body },
    { cookies },
  );
}
