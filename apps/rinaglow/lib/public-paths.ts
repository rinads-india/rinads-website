const PUBLIC_PATH_PREFIXES = ["/login", "/feedback"] as const;

/** Exact path or slash-delimited descendant; near-matches such as /feedback-private stay protected. */
export function isRinaglowPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
