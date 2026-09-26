import { NextResponse, type NextRequest } from "next/server";
import { backendBaseUrl } from "@/lib/server-proxy";

/**
 * Edge route protection (Next.js 16 `proxy` file convention).
 *
 * Session verification is DELEGATED to the Express backend (`GET /api/auth/me`)
 * using the forwarded httpOnly `token` cookie. This removes the need to decode
 * JWTs — or to keep a second copy of `JWT_SECRET` — on the frontend, so the
 * backend remains the single source of truth for authentication.
 *
 *   - Unauthenticated users hitting `/dashboard` or `/builder/*` are redirected
 *     to `/login` (with `?next=` preserving the intended destination).
 *   - `/admin/*` additionally requires a principal whose `role` claim is `admin`.
 */

/** Prefixes that require *any* authenticated session. */
const PROTECTED_PREFIXES = ["/dashboard", "/builder"] as const;
/** Prefixes that additionally require the `admin` role. */
const ADMIN_PREFIXES = ["/admin"] as const;

function matches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Ask the backend who the caller is, forwarding the session cookie. */
async function fetchSession(request: NextRequest): Promise<{ role?: string } | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}/api/auth/me`, {
      method: "GET",
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { role?: string } }
      | null;
    if (!body || body.success === false || !body.data) return null;
    return body.data;
  } catch {
    // Backend unreachable — treat the session as unauthenticated.
    return null;
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const isAdmin = matches(pathname, ADMIN_PREFIXES);
  const isProtected = isAdmin || matches(pathname, PROTECTED_PREFIXES);
  if (!isProtected) return NextResponse.next();

  const user = await fetchSession(request);

  // Unauthenticated -> send to login, remembering where they were headed.
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but not an admin -> bounce to the user dashboard.
  if (isAdmin && user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/admin/:path*"],
};
