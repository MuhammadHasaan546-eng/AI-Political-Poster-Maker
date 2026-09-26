/** Tiny className combiner (no external dependency). */
export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((value): value is string | number => Boolean(value)).join(" ");
}

/** Format an ISO date string for the dashboard. */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Read a File as a data URL (client only). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/** Validate an uploaded file against the shared guardrails. */
export function validateImageFile(
  file: File,
  opts: { maxMb: number; maxFiles: number; currentCount: number },
): { ok: true } | { ok: false; reason: string } {
  if (opts.currentCount >= opts.maxFiles) {
    return { ok: false, reason: `You can upload up to ${opts.maxFiles} photos.` };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "Only image files are allowed." };
  }
  if (file.size > opts.maxMb * 1024 * 1024) {
    return { ok: false, reason: `File size must be under ${opts.maxMb}MB.` };
  }
  return { ok: true };
}

/** Deterministic pseudo-id for mock records. */
export function createId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Rewrite a backend-stored asset URL onto the frontend's same-origin
 * `/storage/...` proxy.
 *
 * Generated posters and uploaded photos are persisted as absolute
 * `<PUBLIC_BASE_URL>/storage/<path>` URLs (e.g. `http://localhost:5000/...`).
 * Loading them via the app's own origin keeps `<img>`/`<canvas>` rendering
 * untainted (so PNG export still works) and makes the assets reachable even
 * when the backend host is not directly addressable from the browser.
 * External/CDN URLs (Cloudinary) are returned unchanged.
 */
export function toSameOriginAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/storage/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return `${marker}${url.slice(index + marker.length)}`;
}
