import { isDevelopmentRuntime, readAuthRuntimeEnv, type AuthRuntimeEnv } from "./env";
import {
  DEV_PORTAL_ORIGINS,
  parseTrustedPortalOrigin,
  PRODUCTION_PORTAL_ORIGINS,
} from "./origins";

export type PortalKey = "website" | "platform" | "owner" | "customer" | "glow";

export type PortalUrlMap = Record<PortalKey, string>;

function isLocalDevOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolvePortalBase(
  envValue: string | undefined,
  productionDefault: string,
  devDefault: string,
  env: AuthRuntimeEnv
): string {
  if (isDevelopmentRuntime(env)) {
    if (envValue && isLocalDevOrigin(envValue)) {
      return envValue.replace(/\/$/, "");
    }
    return devDefault;
  }
  // Preview and production may link to the real portals, but preview auth
  // cookies remain host-only. Never emit localhost from a deployed build.
  if (envValue && parseTrustedPortalOrigin(envValue)) {
    return envValue.replace(/\/$/, "");
  }
  return productionDefault;
}

function defaultPortalEnv(): AuthRuntimeEnv {
  return readAuthRuntimeEnv();
}

export function getPortalUrlMap(env: AuthRuntimeEnv = defaultPortalEnv()): PortalUrlMap {
  return {
    website: resolvePortalBase(
      env.NEXT_PUBLIC_SITE_URL,
      PRODUCTION_PORTAL_ORIGINS.website,
      DEV_PORTAL_ORIGINS.website,
      env
    ),
    platform: resolvePortalBase(
      env.NEXT_PUBLIC_PLATFORM_ADMIN_URL,
      PRODUCTION_PORTAL_ORIGINS.platform,
      DEV_PORTAL_ORIGINS.platform,
      env
    ),
    owner: resolvePortalBase(
      env.NEXT_PUBLIC_OWNER_PORTAL_URL,
      PRODUCTION_PORTAL_ORIGINS.owner,
      DEV_PORTAL_ORIGINS.owner,
      env
    ),
    customer: resolvePortalBase(
      env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL,
      PRODUCTION_PORTAL_ORIGINS.customer,
      DEV_PORTAL_ORIGINS.customer,
      env
    ),
    glow: resolvePortalBase(
      env.NEXT_PUBLIC_RINAGLOW_URL,
      PRODUCTION_PORTAL_ORIGINS.glow,
      DEV_PORTAL_ORIGINS.glow,
      env
    ),
  };
}

export function portalUrl(base: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}

export type PortalLinkKey = "platform" | "owner" | "customer";

export type VisiblePortalLink = {
  key: PortalLinkKey;
  href: string;
};

export function getVisiblePortalLinks(input: {
  privileged: boolean;
  ownerStaff: boolean;
  customer: boolean;
  urls?: PortalUrlMap;
  env?: AuthRuntimeEnv;
}): VisiblePortalLink[] {
  const urls = input.urls ?? getPortalUrlMap(input.env);
  const links: VisiblePortalLink[] = [];
  if (input.privileged) {
    links.push({ key: "platform", href: urls.platform });
  }
  if (input.ownerStaff) {
    links.push({ key: "owner", href: urls.owner });
  }
  if (input.customer) {
    links.push({ key: "customer", href: urls.customer });
  }
  return links;
}
