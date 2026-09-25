import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Load `.env` from the Backend project root. This resolves correctly both when
 * running via `tsx` (src/config) and from the compiled output (dist/config),
 * since both are two levels below the project root.
 */
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** Treat empty / whitespace-only strings as "not provided". */
const blankToUndefined = (value: unknown): unknown => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const optionalString = z.preprocess(blankToUndefined, z.string().optional());
const optionalUrl = z.preprocess(blankToUndefined, z.string().url().optional());

const optionalInt = (fallback: number) =>
  z.preprocess((value) => {
    const v = blankToUndefined(value);
    if (v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }, z.number().int());

const booleanish = (fallback: boolean) =>
  z.preprocess((value) => {
    const v = blankToUndefined(value);
    if (v === undefined) return fallback;
    return String(v).toLowerCase() === 'true' || String(v) === '1';
  }, z.boolean());

/**
 * Env schema. Values whose absence is not fatal use `.optional()`; the only
 * hard requirements are the ones we can safely default. `.catch()` clauses
 * guarantee the loader NEVER throws on bad input, so the server always boots.
 */
const envSchema = z.object({
  // --- Server ---
  NODE_ENV: z.preprocess(blankToUndefined, z.enum(['development', 'test', 'production']).catch('development')),
  PORT: optionalInt(5000).catch(5000),
  CORS_ORIGIN: z.preprocess(blankToUndefined, z.string().catch('http://localhost:3000')).catch('http://localhost:3000'),
  PUBLIC_BASE_URL: z.preprocess(blankToUndefined, z.string().catch('http://localhost:5000')).catch('http://localhost:5000'),

  // --- Database ---
  MONGODB_URI: optionalString,
  DEV_IN_MEMORY_DB: booleanish(false).catch(false),

  // --- Auth ---
  JWT_SECRET: optionalString,
  JWT_EXPIRES_IN: z.preprocess(blankToUndefined, z.string().catch('7d')).catch('7d'),

  // --- Google Gemini ---
  GEMINI_API_KEY: optionalString,
  GEMINI_TEXT_MODEL: z.preprocess(blankToUndefined, z.string().catch('gemini-2.5-flash')).catch('gemini-2.5-flash'),
  GEMINI_IMAGE_MODEL: optionalString,

  // --- Storage ---
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  CLOUDINARY_FOLDER: z.preprocess(blankToUndefined, z.string().catch('nebula-posters')).catch('nebula-posters'),
  STORAGE_DIR: z.preprocess(blankToUndefined, z.string().catch('storage')).catch('storage'),

  // --- Render pipeline ---
  CHROME_EXECUTABLE_PATH: z
    .preprocess(blankToUndefined, z.string().catch('/usr/bin/google-chrome'))
    .catch('/usr/bin/google-chrome'),
  RENDER_CONCURRENCY: optionalInt(2).catch(2),
  RENDER_TIMEOUT_MS: optionalInt(45000).catch(45000),

  // --- Generation limits ---
  MAX_REGENERATIONS: optionalInt(3).catch(3),
  MAX_UPLOAD_MB: optionalInt(8).catch(8),
});

export type RawEnv = z.infer<typeof envSchema>;

/**
 * The fully-resolved, typed runtime environment. Because every field is either
 * present-or-undefined and every non-credential field has a default, this object
 * is always safe to use.
 */
export interface AppEnv extends RawEnv {
  /** Back-compat alias for `CORS_ORIGIN`. */
  FRONTEND_ORIGIN: string;
  /** True when a real MongoDB URI is configured. */
  HAS_MONGODB_URI: boolean;
  /** True when Gemini credentials are configured. */
  HAS_GEMINI: boolean;
  /** True when Cloudinary credentials are configured (else local disk). */
  HAS_CLOUDINARY: boolean;
}

function buildEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  const raw: RawEnv = parsed.success ? parsed.data : envSchema.parse({});

  const corsOrigin = raw.CORS_ORIGIN ?? 'http://localhost:3000';
  const hasMongo = typeof raw.MONGODB_URI === 'string' && raw.MONGODB_URI.length > 0;
  const hasGemini = typeof raw.GEMINI_API_KEY === 'string' && raw.GEMINI_API_KEY.length > 0;
  const hasCloudinary =
    typeof raw.CLOUDINARY_CLOUD_NAME === 'string' &&
    raw.CLOUDINARY_CLOUD_NAME.length > 0 &&
    typeof raw.CLOUDINARY_API_KEY === 'string' &&
    raw.CLOUDINARY_API_KEY.length > 0 &&
    typeof raw.CLOUDINARY_API_SECRET === 'string' &&
    raw.CLOUDINARY_API_SECRET.length > 0;

  return {
    ...raw,
    FRONTEND_ORIGIN: corsOrigin,
    HAS_MONGODB_URI: hasMongo,
    HAS_GEMINI: hasGemini,
    HAS_CLOUDINARY: hasCloudinary,
  };
}

export const env: AppEnv = buildEnv();

/**
 * Names of credentials that are missing but would enable extra capability.
 * Non-fatal — the API keeps serving with graceful degradation.
 */
function collectMissingCredentials(e: AppEnv): string[] {
  const missing: string[] = [];
  if (!e.HAS_MONGODB_URI && !e.DEV_IN_MEMORY_DB) missing.push('MONGODB_URI');
  if (!e.JWT_SECRET) missing.push('JWT_SECRET');
  if (!e.HAS_GEMINI) missing.push('GEMINI_API_KEY');
  if (!e.HAS_CLOUDINARY) {
    missing.push('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET');
  }
  return missing;
}

/** The missing-credential list (empty when everything is configured). */
export const missingEnvVars: string[] = collectMissingCredentials(env);

/**
 * Log a clear, non-fatal warning describing degraded capabilities.
 * Called once during bootstrap. NEVER throws.
 */
export function logEnvWarnings(): void {
  if (missingEnvVars.length === 0) {
    console.log('[env] All credentials present — full functionality enabled.');
    return;
  }

  console.warn('============================================================');
  console.warn('[env] WARNING: running with missing credentials (degraded mode)');
  console.warn(`[env] Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('[env] The server will still start. Affected capabilities:');
  if (!env.HAS_MONGODB_URI && !env.DEV_IN_MEMORY_DB) {
    console.warn('[env]   - Database: DISABLED (set MONGODB_URI, or DEV_IN_MEMORY_DB=true)');
  }
  if (!env.JWT_SECRET) {
    console.warn('[env]   - Auth: DISABLED (set JWT_SECRET)');
  }
  if (!env.HAS_GEMINI) {
    console.warn('[env]   - AI layout reasoning: DISABLED (set GEMINI_API_KEY)');
  }
  if (!env.HAS_CLOUDINARY) {
    console.warn(`[env]   - Cloud storage: falling back to local disk at "${env.STORAGE_DIR}"`);
  }
  console.warn('============================================================');
}
