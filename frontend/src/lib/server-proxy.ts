import { NextResponse } from "next/server";

/**
 * Server-side proxy to the Express API.
 *
 * The Next.js route handlers under `app/api/**` used to serve an in-memory mock.
 * They are now thin, same-origin proxies: the browser keeps talking to
 * `/api/*` (so the backend's httpOnly auth cookie stays first-party), while the
 * Node runtime forwards each call to the Express service defined by
 * `BACKEND_URL` / `NEXT_PUBLIC_API_URL`.
 */

const DEFAULT_BACKEND = "http://localhost:5000";

/** Absolute base URL of the Express backend (no trailing slash). */
export function backendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    DEFAULT_BACKEND;
  return raw.replace(/\/+$/, "");
}

/** Host-only cookie: drop any `Domain` attribute the upstream may have set. */
const DEFAULT_COOKIE_OPTIONS = { path: "/" } as const;

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();

  // Preserve the auth cookie and any Set-Cookie directives verbatim. Reading
  // each cookie via the Headers instance (instead of `getSetCookie()`) keeps
  // this working on both the Node and Edge runtimes.
  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    for (const value of setCookies) {
      headers.append("set-cookie", value);
    }
  } else {
    const raw = upstream.headers.get("set-cookie");
    if (raw) headers.append("set-cookie", raw);
  }

  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cacheControl = upstream.headers.get("cache-control");
  if (cacheControl) headers.set("cache-control", cacheControl);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);
  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) headers.set("content-disposition", contentDisposition);
  return headers;
}

/** Attributes applied when re-asserting the session cookie. */
interface CookieAttributes {
  secure: boolean;
  sameSite: "none" | "lax";
}

/**
 * Copy a cookie from an incoming request onto the outgoing {@link NextResponse}.
 *
 * Using `response.cookies.set` guarantees the modern `SameSite=None; Secure`
 * attributes survive Vercel's edge/proxy layer, which is what makes the
 * cross-site session persist in the browser. The attributes are derived from the
 * request scheme: `None; Secure` over HTTPS (Vercel/Render), `Lax` over plain
 * HTTP so local development keeps working. Any upstream `Domain` attribute is
 * stripped so the session remains a first-party, host-only cookie.
 */
function mirrorCookie(
  response: NextResponse,
  name: string,
  value: string,
  attributes: CookieAttributes,
  expires?: Date,
): void {
  response.cookies.set({
    name,
    value,
    ...DEFAULT_COOKIE_OPTIONS,
    sameSite: attributes.sameSite,
    secure: attributes.secure,
    httpOnly: true,
    expires,
  });
}

/**
 * Forward a request to the backend and mirror its response.
 *
 * The body is streamed straight through (not buffered), so this works for both
 * small JSON envelopes and large binary assets such as rendered PNG/PDF files.
 *
 * @param path     Backend path beginning with `/` (e.g. `/api/posters`).
 * @param init     Fetch init; `body` should already be serialized.
 */
export async function proxyToBackend(
  path: string,
  init: RequestInit,
  forward?: {
    cookies?: { name: string; value: string }[];
    cookieAttributes?: CookieAttributes;
  },
): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${backendBaseUrl()}${path}`, {
      ...init,
      // The browser's httpOnly cookie is forwarded explicitly so the backend
      // can authenticate the call even though this is a server-to-server hop.
      cache: "no-store",
      redirect: "manual",
    });

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders(upstream),
    });

    // Re-assert auth cookies via the NextResponse cookie API for cross-site safety.
    const attributes: CookieAttributes =
      forward?.cookieAttributes ?? { secure: true, sameSite: "none" };
    const upcoming = upstream.headers.getSetCookie?.() ?? [];
    const upcomingRaw = upcoming.length === 0 ? upstream.headers.get("set-cookie") : null;
    const expired = /max-age=0|expires=thu, 01 jan 1970/i.test(upcomingRaw ?? upcoming.join("; "));

    // Prefer the freshly-set `token` cookie; fall back to echoing the request cookie
    // so the session survives even if the upstream header is dropped in transit.
    const upstreamToken = extractCookie(upcoming.length > 0 ? upcoming.join("\n") : upcomingRaw, "token");
    if (upstreamToken && !expired) {
      mirrorCookie(response, "token", upstreamToken, attributes);
    } else if (!expired) {
      const forwarded = forward?.cookies?.find((cookie) => cookie.name === "token");
      if (forwarded) mirrorCookie(response, "token", forwarded.value, attributes);
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not connect to the server. Please check that the backend is running.",
      },
      { status: 502 },
    );
  }
}

/** Build the forwarded request init from an incoming Request. */
export function forwardInit(request: Request, method: string): RequestInit {
  const cookie = request.headers.get("cookie");
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;
  return { method, headers };
}

/** Parse a single cookie value out of one or more raw `Set-Cookie` strings. */
function extractCookie(raw: string | null, name: string): string | undefined {
  if (!raw) return undefined;
  for (const line of raw.split("\n")) {
    const match = line.match(new RegExp(`(?:^|;)\\s*${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Build a credentials-aware request init and capture the inbound cookies so the
 * response can re-assert the session cookie to the browser.
 *
 * The cookie attributes are inferred from the request scheme (or the
 * `x-forwarded-proto` header set by Vercel/Render), so the same code produces a
 * `SameSite=None; Secure` cookie on HTTPS and a working `SameSite=Lax` cookie
 * over plain-HTTP local development.
 */
export function credentialsInit(request: Request, method: string) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps =
    forwardedProto === "https" || new URL(request.url).protocol === "https:";

  return {
    init: forwardInit(request, method),
    cookies: parseRequestCookies(request.headers.get("cookie")),
    cookieAttributes: {
      secure: isHttps,
      sameSite: isHttps ? ("none" as const) : ("lax" as const),
    },
  };
}

/** Parse the `Cookie` request header into an array of name/value pairs. */
function parseRequestCookies(header: string | null): { name: string; value: string }[] {
  if (!header) return [];
  return header
    .split(";")
    .map((segment) => segment.trim())
    .filter((segment) => segment.includes("="))
    .map((segment) => {
      const eq = segment.indexOf("=");
      return { name: segment.slice(0, eq).trim(), value: segment.slice(eq + 1).trim() };
    });
}
