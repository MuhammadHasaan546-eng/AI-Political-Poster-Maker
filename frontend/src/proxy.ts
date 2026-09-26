import { NextResponse, type NextRequest } from "next/server";
import { verifyJwtEdge } from "@/lib/jwt-edge";

/**
 * Edge route protection (Next.js 16 `proxy` file convention).
 *
 * The backend's httpOnly `token` cookie is the session of record, so this proxy
 * verifies it (HS256, Web Crypto) and:
 *   - redirects unauthenticated users away from `/dashboard` and `/builder/*`
 *     to `/login` (preserving the intended destination via `?next=`),
 *   - restricts `/admin/*` to principals whose role claim is `admin`.
 *
 * The shared `JWT_SECRET` must match the backend's signing secret.
 */

const AUTH_COOKIE = "token";

/** Prefixes that require *any* authenticated session. */
const PROTECTED_PREFIXES = ["/dashboard", "/builder"] as const;
/** Prefixes that additionally require the `admin` role. */
const ADMIN_PREFIXES = ["/admin"] as const;

function matches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const isAdmin = matches(pathname, ADMIN_PREFIXES);
  const isProtected = isAdmin || matches(pathname, PROTECTED_PREFIXES);
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const secret = process.env.JWT_SECRET ?? "";
  const payload = await verifyJwtEdge(token, secret);

  // Unauthenticated -> send to login, remembering where they were headed.
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but not an admin -> bounce to the user dashboard.
  if (isAdmin && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/admin/:path*"],
};
