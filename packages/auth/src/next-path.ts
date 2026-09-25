/**
 * Hardened relative `next` sanitizer.
 * Rejects protocol-relative URLs, backslashes, control characters,
 * encoded slash/backslash tricks, and overlong values.
 */

export const MAX_RELATIVE_NEXT_LENGTH = 1024;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const ENCODED_SLASH = /%2f/i;
const ENCODED_BACKSLASH = /%5c/i;
const DOUBLE_ENCODED_SLASH = /%252f/i;
const DOUBLE_ENCODED_BACKSLASH = /%255c/i;

function containsEncodedPathTricks(value: string): boolean {
  return (
    ENCODED_SLASH.test(value) ||
    ENCODED_BACKSLASH.test(value) ||
    DOUBLE_ENCODED_SLASH.test(value) ||
    DOUBLE_ENCODED_BACKSLASH.test(value)
  );
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function sanitizeRelativeNext(next: string | null | undefined): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.length > MAX_RELATIVE_NEXT_LENGTH) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.includes("\\") || next.includes("\0")) return null;
  if (CONTROL_CHARS.test(next)) return null;
  if (containsEncodedPathTricks(next)) return null;

  const decoded = safeDecode(next);
  if (decoded === null) return null;
  if (decoded !== next) {
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return null;
    }
    if (decoded.includes("\\") || CONTROL_CHARS.test(decoded)) return null;
    if (containsEncodedPathTricks(decoded)) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return null;
  }

  if (next.includes("://") || /^\/[a-z][a-z0-9+.-]*:/i.test(next)) return null;

  return next;
}
