const PUBLIC_PATH_PREFIXES = ["/login", "/feedback"] as const;

/**
 * R GLOW's marketing front door is public; console routes remain protected.
 * Prefix matching is slash-delimited so near-matches such as
 * `/feedback-private` do not accidentally become public.
 */
export function isRinaglowPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
