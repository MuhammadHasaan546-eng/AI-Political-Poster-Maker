import { credentialsInit, proxyToBackend } from "@/lib/server-proxy";

/**
 * POST /api/auth/register — proxied to the Express backend.
 *
 * Auto-login: the auth cookie minted on registration is re-asserted to the
 * browser so the user is signed in immediately after creating an account.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const { init, cookies } = credentialsInit(request, "POST");
  return proxyToBackend(
    "/api/auth/register",
    { ...init, body },
    { cookies },
  );
}
