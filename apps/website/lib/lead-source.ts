/**
 * Keep campaign attribution in a bounded, non-PII lead source path.
 * Do not persist arbitrary query strings, emails, tokens or free text.
 */
const SOURCE_TAG = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function contactSourcePath(rawSource: string | null): string {
  const source = rawSource?.trim().toLowerCase() ?? "";
  if (source === "start") return "/start";
  if (!SOURCE_TAG.test(source)) return "/contact";
  return `/contact?source=${encodeURIComponent(source)}`;
}
