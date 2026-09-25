/**
 * Storage driver contract — FROZEN CONTRACT for downstream slices.
 *
 * Any storage backend (Cloudinary, local disk, S3, ...) MUST implement
 * `StorageDriver` so the rest of the codebase is provider-agnostic.
 */

export interface StorageUploadResult {
  /** Publicly resolvable URL of the stored asset. */
  url: string;
  /** Provider-specific identifier used for deletion / re-referencing. */
  publicId: string;
}

export interface StorageUploadOptions {
  /** Logical folder / collection to store the asset under. */
  folder?: string;
  /** Desired filename (without extension) if the provider supports it. */
  filename?: string;
  /** MIME type of the buffer, e.g. `image/png`. */
  mimeType?: string;
  /** Explicit public id (overwrite semantics where supported). */
  publicId?: string;
  /** Whether to overwrite an existing asset with the same publicId. */
  overwrite?: boolean;
  /** Freeform provider tags. */
  tags?: string[];
}

export interface StorageDriver {
  /** Human-readable driver name, e.g. `cloudinary` or `local`. */
  readonly name: string;
  /** Upload a binary buffer and return its public URL + id. */
  upload(buffer: Buffer, opts?: StorageUploadOptions): Promise<StorageUploadResult>;
  /** Optional: delete a previously stored asset by its publicId. */
  delete?(publicId: string): Promise<void>;
}
