/**
 * Edge-compatible HS256 JWT verification.
 *
 * Next.js middleware runs on the Edge runtime (no Node `crypto` / `jsonwebtoken`),
 * so this helper verifies the backend-issued token using the Web Crypto API
 * instead. It is intentionally dependency-free.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Decode a base64url segment into raw bytes (backed by a plain ArrayBuffer). */
function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Decoded JWT claims relevant to authorisation. */
export interface EdgeJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
}

/**
 * Verify an HS256 JWT and return its payload, or `null` when the token is
 * missing, malformed, expired, or signed with a different secret.
 */
export async function verifyJwtEdge(
  token: string | undefined,
  secret: string,
): Promise<EdgeJwtPayload | null> {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureB64),
      encoder.encode(`${headerB64}.${payloadB64}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      decoder.decode(base64UrlToBytes(payloadB64)),
    ) as EdgeJwtPayload;

    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return null;
    }
    if (typeof payload.sub !== "string") return null;

    return payload;
  } catch {
    return null;
  }
}
