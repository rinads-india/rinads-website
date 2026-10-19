/**
 * CMS Phase C slice C2 — media upload helpers.
 *
 * Pure validation / path builders used by platform-admin before uploading to
 * Supabase Storage (or the demo in-memory fallback). Keep this module free of
 * framework and Supabase imports so unit tests stay hermetic.
 */

export const CMS_MEDIA_BUCKET = "rinads-cms";

/** Default max upload size (5 MiB), matching the storage bucket limit. */
export const CMS_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export const CMS_MEDIA_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export type CmsMediaAllowedMime = (typeof CMS_MEDIA_ALLOWED_MIME_TYPES)[number];

const EXT_BY_MIME: Record<CmsMediaAllowedMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/** Strip path segments and unsafe characters from an upload file name. */
export function sanitizeMediaFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() || "upload";
  const cleaned = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "");
  return cleaned || "upload";
}

export type ValidateCmsMediaUploadInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  maxBytes?: number;
};

export type ValidateCmsMediaUploadResult =
  | { ok: true; fileName: string; mimeType: CmsMediaAllowedMime }
  | { ok: false; error: string };

/** Fail-closed validation for CMS media uploads. */
export function validateCmsMediaUpload(input: ValidateCmsMediaUploadInput): ValidateCmsMediaUploadResult {
  const fileName = sanitizeMediaFileName(input.fileName);
  const mimeType = (input.mimeType || "").toLowerCase().trim();
  const maxBytes = input.maxBytes ?? CMS_MEDIA_MAX_BYTES;

  if (!fileName) {
    return { ok: false, error: "A file name is required." };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { ok: false, error: "File is empty." };
  }
  if (input.sizeBytes > maxBytes) {
    return { ok: false, error: `File exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB limit.` };
  }
  if (!(CMS_MEDIA_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return {
      ok: false,
      error: "Unsupported file type. Use PNG, JPEG, WebP, GIF, or SVG.",
    };
  }

  return { ok: true, fileName, mimeType: mimeType as CmsMediaAllowedMime };
}

export type BuildCmsMediaStoragePathOptions = {
  fileName: string;
  mimeType?: string;
  /** Injectable clock for tests. */
  now?: Date;
  /** Injectable id fragment for tests (defaults to random hex). */
  id?: string;
};

/**
 * Build a unique object key under the CMS media bucket.
 * Shape: `uploads/YYYY/MM/<id>-<sanitized-name>`
 */
export function buildCmsMediaStoragePath(options: BuildCmsMediaStoragePathOptions): string {
  const now = options.now ?? new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = options.id ?? randomId();
  let fileName = sanitizeMediaFileName(options.fileName);

  if (!/\.[a-z0-9]+$/i.test(fileName) && options.mimeType) {
    const mime = options.mimeType.toLowerCase() as CmsMediaAllowedMime;
    const ext = EXT_BY_MIME[mime];
    if (ext) fileName = `${fileName}.${ext}`;
  }

  return `uploads/${year}/${month}/${id}-${fileName}`;
}

export function resolveCmsMediaBucket(
  env: Record<string, string | undefined> = process.env,
): string {
  const fromEnv = env.CMS_MEDIA_BUCKET?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : CMS_MEDIA_BUCKET;
}

function randomId(): string {
  // Prefer Web Crypto when available (Node 20+, browsers); fall back for older runtimes.
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.floor(Math.random() * 1e8).toString(16)}`;
}
