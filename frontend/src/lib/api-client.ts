import type {
  ApiResponse,
  GeneratePosterRequest,
  LayoutConfig,
  LayoutSuggestion,
  OccasionType,
  Poster,
  PosterStatus,
  Template,
  User,
} from "./types";

/** Thin fetch wrapper that normalises the `ApiResponse<T>` envelope. */
async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!res.ok || !body || body.success === false) {
    const message =
      body && body.success === false ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body.data;
}

/* --------------------------------- Auth --------------------------------- */

export async function apiLogin(
  identifier: string,
  password: string,
): Promise<User> {
  return request<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function apiRegister(input: {
  name: string;
  identifier: string;
  password: string;
}): Promise<User> {
  return request<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Rehydrate the session directly from the server-side httpOnly cookie.
 *
 * Resolves with the current {@link User} when a valid cookie is present, and
 * `null` when the caller is unauthenticated (401) — so callers can treat a
 * missing session as a normal, non-throwing state.
 */
export async function apiGetMe(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
  if (res.status === 401) return null;

  const body = (await res.json().catch(() => null)) as ApiResponse<User> | null;
  if (!res.ok || !body || body.success === false) return null;
  return body.data;
}

/** Clear the server-side httpOnly session cookie. Never throws. */
export async function apiLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Best-effort: the client clears local state regardless.
  }
}

/* ------------------------------- Templates ------------------------------- */

export async function apiGetTemplates(): Promise<Template[]> {
  return request<Template[]>("/api/templates");
}

export async function apiGetTemplate(id: string): Promise<Template> {
  return request<Template>(`/api/templates/${id}`);
}

/* -------------------------------- Posters -------------------------------- */

export interface PosterPagination {
  limit?: number;
  offset?: number;
}

function paginationQuery(params?: PosterPagination): string {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export async function apiGeneratePoster(
  payload: GeneratePosterRequest,
): Promise<Poster> {
  return request<Poster>("/api/posters", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiGetPoster(id: string): Promise<Poster> {
  return request<Poster>(`/api/posters/${id}`);
}

/** The caller's poster history, newest first (supports limit/offset paging). */
export async function apiListPosters(
  params?: PosterPagination,
): Promise<Poster[]> {
  return request<Poster[]>(`/api/posters${paginationQuery(params)}`, {
    method: "GET",
  });
}

export async function apiDeletePoster(id: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/posters/${id}`, { method: "DELETE" });
}

/** Optional render overrides accepted when re-rolling a poster. */
export interface RegenerateOverrides {
  fontFamily?: string;
  headlineColor?: string;
  showMotifs?: boolean;
  showFooterBar?: boolean;
}

/** POST /api/posters/:id/regenerate — re-roll an existing poster. */
export async function apiRegeneratePoster(
  id: string,
  overrides?: RegenerateOverrides,
): Promise<Poster> {
  return request<Poster>(`/api/posters/${id}/regenerate`, {
    method: "POST",
    body: JSON.stringify(overrides ? { overrides } : {}),
  });
}

/* --------------------------------- Upload --------------------------------- */

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a batch of images in a single multipart request.
 *
 * The backend's multer middleware (`upload.array('photos', 3)`) expects every
 * file to be sent under the `photos` field name — sending them under `file`
 * makes multer reject the request with `LIMIT_UNEXPECTED_FILE` (HTTP 400).
 * The response is always an array of results, in the same order as the files.
 */
export async function apiUploadImages(files: File[]): Promise<UploadResult[]> {
  if (files.length === 0) return [];
  const data = new FormData();
  for (const file of files) data.append("photos", file);

  const res = await fetch("/api/upload", { method: "POST", body: data });
  const body = (await res.json()) as ApiResponse<UploadResult[]>;
  if (!res.ok || body.success === false) {
    throw new Error(body.success === false ? body.error : "Upload failed.");
  }
  return body.data;
}

/**
 * Upload one image. Convenience wrapper over {@link apiUploadImages} that
 * returns the first result so single-file callers keep a `{ url, publicId }`
 * contract.
 */
export async function apiUploadImage(file: File): Promise<UploadResult> {
  const results = await apiUploadImages([file]);
  const first = results[0];
  if (!first) throw new Error("Upload failed.");
  return first;
}

/* ------------------------------ AI analysis ------------------------------ */

export interface AnalyzeRequest {
  occasionType: string;
  headline: string;
  paletteHint?: string[];
}

export async function apiAnalyzeLayout(
  payload: AnalyzeRequest,
): Promise<LayoutSuggestion> {
  return request<LayoutSuggestion>("/api/posters/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* --------------------------------- Admin --------------------------------- */

/** Aggregated platform telemetry for the admin overview. */
export interface AdminStats {
  templates: { total: number; active: number };
  posters: {
    total: number;
    pending: number;
    generating: number;
    completed: number;
    failed: number;
  };
  users: { total: number };
  logs: {
    total: number;
    success: number;
    failed: number;
    avgLatencyMs: number;
    totalTokens: number;
  };
}

export interface GenerationLogEntry {
  id: string;
  posterId: string;
  success: boolean;
  latencyMs: number;
  tokenEstimate: number;
  errorMessage: string | null;
  createdAt: string;
}

/** Payload accepted by the admin template create/update endpoints. */
export interface AdminTemplateInput {
  name: string;
  occasionType: OccasionType;
  thumbnailUrl?: string;
  isActive?: boolean;
  layoutConfig: LayoutConfig;
}

export async function apiAdminStats(): Promise<AdminStats> {
  return request<AdminStats>("/api/admin/stats");
}

export async function apiAdminLogs(): Promise<GenerationLogEntry[]> {
  return request<GenerationLogEntry[]>("/api/admin/logs");
}

export async function apiAdminListPosters(params?: {
  status?: PosterStatus;
  limit?: number;
  offset?: number;
}): Promise<Poster[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return request<Poster[]>(`/api/admin/posters${query ? `?${query}` : ""}`);
}

/** @deprecated Use {@link apiGetTemplates}. Kept for admin parity. */
export async function apiAdminListTemplates(): Promise<Template[]> {
  return request<Template[]>("/api/admin/templates");
}

export async function apiAdminCreateTemplate(
  input: AdminTemplateInput,
): Promise<Template> {
  return request<Template>("/api/admin/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiAdminUpdateTemplate(
  id: string,
  input: Partial<AdminTemplateInput>,
): Promise<Template> {
  return request<Template>(`/api/admin/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function apiAdminDeleteTemplate(
  id: string,
): Promise<{ id: string; isActive: boolean }> {
  return request<{ id: string; isActive: boolean }>(`/api/admin/templates/${id}`, {
    method: "DELETE",
  });
}

/** Re-seed the built-in production templates (admin only). */
export async function apiAdminSeedTemplates(): Promise<{ inserted: number }> {
  return request<{ inserted: number }>("/api/admin/templates/seed", {
    method: "POST",
  });
}

/** Baseline layout used to scaffold new templates in the admin UI. */
export async function apiAdminDefaultLayout(): Promise<LayoutConfig> {
  return request<LayoutConfig>("/api/admin/layout-default");
}
