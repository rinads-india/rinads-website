import { sanitizeRelativeNext } from "@rinads/auth";

export const WEBSITE_PROTECTED_PREFIXES = ["/os", "/onboarding", "/space"] as const;

function normalizePathname(pathname: string): string {
  const raw = pathname.split("?")[0]?.trim() || "/";
  // Only accept an ordinary same-origin absolute pathname. Protocol-relative
  // (`//host`) and backslash-based inputs are rejected before they can become
  // a login `next` destination.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/";
  }
  if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
  return raw;
}

export function isWebsiteProtectedPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return WEBSITE_PROTECTED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function normalizeSearch(search: string): string {
  if (!search) return "";
  return search.startsWith("?") ? search : `?${search}`;
}

export function buildWebsiteLoginRedirect(pathname: string, search = ""): string {
  const normalized = normalizePathname(pathname);
  const candidate = `${normalized}${normalizeSearch(search)}`;
  const safeNext = sanitizeRelativeNext(candidate) ?? "/os";
  const params = new URLSearchParams({ mode: "login", next: safeNext });
  return `/signup?${params.toString()}`;
}

export type WebsiteAuthDecision =
  | { type: "next" }
  | { type: "redirect"; to: string };

export function resolveWebsiteAuthDecision(input: {
  pathname: string;
  search?: string;
  authMode: "demo" | "supabase";
  isAuthenticated: boolean;
}): WebsiteAuthDecision {
  if (input.authMode !== "supabase") return { type: "next" };
  if (!isWebsiteProtectedPath(input.pathname)) return { type: "next" };
  if (input.isAuthenticated) return { type: "next" };
  return {
    type: "redirect",
    to: buildWebsiteLoginRedirect(input.pathname, input.search),
  };
}
