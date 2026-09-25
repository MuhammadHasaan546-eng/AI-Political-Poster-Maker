import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import type { StorageDriver, StorageUploadOptions, StorageUploadResult } from '../types/storage';

/**
 * Storage providers.
 *
 * `createStorage()` returns a Cloudinary driver when credentials are present,
 * otherwise a local-disk driver. Both satisfy the frozen {@link StorageDriver}
 * contract, so callers never branch on the provider.
 */

/** Map a MIME type to a file extension (defaults to `.bin`). */
function extensionFor(mimeType: string | undefined, fallback = 'png'): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
      return 'png';
    case 'application/pdf':
      return 'pdf';
    case 'image/svg+xml':
      return 'svg';
    default:
      return mimeType && mimeType.startsWith('image/') ? fallback : 'bin';
  }
}

/** Content type for serving local files back over HTTP. */
export function contentTypeFor(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'pdf':
      return 'application/pdf';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

/** Absolute path to the local storage root (relative to the Backend root). */
export const STORAGE_ROOT = path.resolve(__dirname, '../../', env.STORAGE_DIR);

/**
 * Local-disk driver. Writes assets under `STORAGE_DIR` and exposes them via the
 * Express static mount at `/storage`.
 */
class LocalStorageDriver implements StorageDriver {
  readonly name = 'local';

  async upload(buffer: Buffer, opts: StorageUploadOptions = {}): Promise<StorageUploadResult> {
    const folder = opts.folder ? opts.folder.replace(/^\/+|\/+$/g, '') : '';
    const ext = extensionFor(opts.mimeType);
    const base = (opts.filename ?? opts.publicId ?? crypto.randomUUID())
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 80);
    const filename = `${base}.${ext}`;
    const relative = path.posix.join(folder, filename);

    const target = path.join(STORAGE_ROOT, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);

    const baseUrl = env.PUBLIC_BASE_URL.replace(/\/+$/, '');
    return { url: `${baseUrl}/storage/${relative}`, publicId: relative };
  }

  async delete(publicId: string): Promise<void> {
    const target = path.join(STORAGE_ROOT, publicId);
    // Guard against path traversal escaping the storage root.
    if (!target.startsWith(STORAGE_ROOT)) return;
    await fs.rm(target, { force: true });
  }
}

/** Cloudinary driver (used when all three credentials are configured). */
class CloudinaryStorageDriver implements StorageDriver {
  readonly name = 'cloudinary';

  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  upload(buffer: Buffer, opts: StorageUploadOptions = {}): Promise<StorageUploadResult> {
    const folder = opts.folder ?? env.CLOUDINARY_FOLDER;

    return new Promise<StorageUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: opts.publicId,
          overwrite: opts.overwrite ?? false,
          tags: opts.tags,
        },
        (error, result) => {
          if (error || !result) {
            reject(error instanceof Error ? error : new Error('Cloudinary upload failed.'));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  }
}

let cached: StorageDriver | null = null;

/**
 * Resolve the active storage driver.
 *
 * Cloudinary when `HAS_CLOUDINARY`, else local disk. Called lazily so importing
 * this module never performs I/O or requires credentials.
 */
export function createStorage(): StorageDriver {
  if (cached) return cached;

  if (env.HAS_CLOUDINARY) {
    try {
      cached = new CloudinaryStorageDriver();
      console.log('[storage] Using Cloudinary driver.');
      return cached;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[storage] Cloudinary init failed (${message}); using local disk.`);
    }
  }

  cached = new LocalStorageDriver();
  console.log(`[storage] Using local disk driver at "${STORAGE_ROOT}".`);
  return cached;
}

/** Ensure the local storage root exists (no-op for Cloudinary). */
export async function ensureStorageReady(): Promise<void> {
  const driver = createStorage();
  if (driver.name === 'local') {
    await fs.mkdir(STORAGE_ROOT, { recursive: true });
  }
}

export { LocalStorageDriver, CloudinaryStorageDriver };
