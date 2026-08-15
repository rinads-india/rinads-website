import crypto from "node:crypto";

export type DomainStatus = "pending" | "verified" | "active" | "disabled";
export type VerificationMethod = "txt" | "cname";

export type OrganizationDomain = {
  id: string;
  organizationId: string;
  hostname: string;
  status: DomainStatus;
  verificationMethod: VerificationMethod;
  verificationToken: string;
  verifiedAt?: string;
  vercelDomainId?: string;
  lastCheckedAt?: string;
};

export function generateVerificationToken(): string {
  return `rinads-verify-${crypto.randomBytes(16).toString("hex")}`;
}

export function buildTxtVerificationRecord(token: string): { host: string; value: string } {
  return { host: "_rinads-verify", value: token };
}

export function buildCnameVerificationRecord(token: string, targetHost: string): { host: string; value: string } {
  return { host: token, value: targetHost };
}

export function canTransitionDomainStatus(from: DomainStatus, to: DomainStatus): boolean {
  const allowed: Record<DomainStatus, DomainStatus[]> = {
    pending: ["verified", "disabled"],
    verified: ["active", "disabled"],
    active: ["disabled"],
    disabled: ["pending"],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function transitionDomainStatus(
  domain: OrganizationDomain,
  to: DomainStatus
): OrganizationDomain | { error: string } {
  if (!canTransitionDomainStatus(domain.status, to)) {
    return { error: `Cannot transition from ${domain.status} to ${to}` };
  }
  const updated: OrganizationDomain = { ...domain, status: to };
  if (to === "verified" || to === "active") {
    updated.verifiedAt = updated.verifiedAt ?? new Date().toISOString();
  }
  updated.lastCheckedAt = new Date().toISOString();
  return updated;
}

export function parseStorefrontSlugFromHost(
  host: string,
  platformDomain = "store.rinads.com"
): string | null {
  const normalized = host.toLowerCase().split(":")[0]!;
  if (!normalized.endsWith(`.${platformDomain}`)) return null;
  const slug = normalized.slice(0, -(platformDomain.length + 1));
  if (!slug || slug.includes(".")) return null;
  return slug;
}

export * from "./vercel";
export * from "./resolver";
