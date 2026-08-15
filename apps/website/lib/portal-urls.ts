export function getPortalUrls() {
  return {
    owner: process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? "http://localhost:3003",
    customer: process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? "http://localhost:3002",
    platform: process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL ?? "http://localhost:3004",
  } as const;
}

export function portalUrl(base: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}
