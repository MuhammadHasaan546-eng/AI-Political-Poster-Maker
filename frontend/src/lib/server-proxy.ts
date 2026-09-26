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

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  // Preserve the auth cookie and any Set-Cookie directives verbatim.
  for (const value of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", value);
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

/**
 * Forward a request to the backend and mirror its response.
 *
 * The body is streamed straight through (not buffered), so this works for both
 * small JSON envelopes and large binary assets such as rendered PNG/PDF files.
 *
 * @param path     Backend path beginning with `/` (e.g. `/api/posters`).
 * @param init     Fetch init; `body` should already be serialized.
 */
export async function proxyToBackend(path: string, init: RequestInit): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${backendBaseUrl()}${path}`, {
      ...init,
      // The browser's httpOnly cookie is forwarded explicitly so the backend
      // can authenticate the call even though this is a server-to-server hop.
      cache: "no-store",
      redirect: "manual",
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders(upstream),
    });
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
