import { sanitizeRelativeNext } from "./next-path";

export const PORTAL_LOGIN_PATH = "/login";
export const PORTAL_FORBIDDEN_PATH = "/forbidden";
export const PORTAL_HEALTH_PATH = "/api/health";

export const DEFAULT_PORTAL_PUBLIC_PATHS = [
  PORTAL_LOGIN_PATH,
  PORTAL_FORBIDDEN_PATH,
  PORTAL_HEALTH_PATH,
] as const;

export type PortalMiddlewareDecision =
  | { type: "next" }
  | { type: "redirect"; to: string };

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isPortalPublicPath(
  pathname: string,
  extraPublicPaths: readonly string[] = []
): boolean {
  const path = normalizePath(pathname.split("?")[0] ?? pathname);
  const all = [...DEFAULT_PORTAL_PUBLIC_PATHS, ...extraPublicPaths];
  return all.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`));
}

export function buildLoginRedirectPath(pathname: string, search = ""): string {
  const candidate = `${pathname}${search}`;
  const safeNext = sanitizeRelativeNext(candidate.startsWith("/") ? candidate : `/${candidate}`) ?? "/";
  return `${PORTAL_LOGIN_PATH}?next=${encodeURIComponent(safeNext)}`;
}

export function resolvePortalMiddlewareDecision(input: {
  pathname: string;
  search?: string;
  isAuthenticated: boolean;
  extraPublicPaths?: readonly string[];
  defaultAuthenticatedPath?: string;
}): PortalMiddlewareDecision {
  const pathname = normalizePath(input.pathname);
  const search = input.search ?? "";
  const extra = input.extraPublicPaths ?? [];
  const defaultPath = input.defaultAuthenticatedPath ?? "/";

  if (pathname === PORTAL_LOGIN_PATH) {
    if (input.isAuthenticated) {
      const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
      const next = sanitizeRelativeNext(params.get("next")) ?? defaultPath;
      return { type: "redirect", to: next };
    }
    return { type: "next" };
  }

  if (isPortalPublicPath(pathname, extra)) {
    return { type: "next" };
  }

  if (!input.isAuthenticated) {
    return { type: "redirect", to: buildLoginRedirectPath(pathname, search) };
  }

  return { type: "next" };
}
