export const OS_PATH = "/os";
export const ONBOARDING_PATH = "/onboarding/create-organization";

export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function getDemoPostAuthPath(): string {
  return OS_PATH;
}
