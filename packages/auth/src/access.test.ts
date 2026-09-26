import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeRelativeNext, MAX_RELATIVE_NEXT_LENGTH } from "./next-path";
import {
  parseTrustedPortalOrigin,
  parseTrustedPortalDestination,
  PRODUCTION_PORTAL_ORIGINS,
  CANONICAL_AUTH_ORIGIN,
} from "./origins";
import { isProductionCookieEnv, allowDevelopmentAuthBypass, isDevelopmentRuntime } from "./env";
import { AUTH_COOKIE_DOMAIN, getSharedAuthCookieOptions } from "./cookies";
import { resolveAuthCallbackDestination, hasAuthCallbackGrant, parseRecoveryOtpType } from "./callback";
import { resolvePortalMiddlewareDecision, buildLoginRedirectPath } from "./middleware-decision";
import { getPortalUrlMap, getVisiblePortalLinks, portalUrl } from "./portals";
import {
  requestPasswordReset,
  exchangeCodeForSession,
  verifyOtpToken,
  updatePassword,
  PASSWORD_RESET_GENERIC_MESSAGE,
  type SupabaseAuthApi,
} from "./supabase-auth";

describe("sanitizeRelativeNext", () => {
  it("accepts local paths", () => {
    assert.equal(sanitizeRelativeNext("/os"), "/os");
    assert.equal(sanitizeRelativeNext("/login?next=/os"), "/login?next=/os");
    assert.equal(sanitizeRelativeNext("/operations"), "/operations");
  });

  it("rejects protocol-relative, schemes, and backslashes", () => {
    assert.equal(sanitizeRelativeNext("//evil.com"), null);
    assert.equal(sanitizeRelativeNext("/\\evil.com"), null);
    assert.equal(sanitizeRelativeNext("https://evil.com"), null);
    assert.equal(sanitizeRelativeNext("/os\\..\\admin"), null);
    assert.equal(sanitizeRelativeNext("os"), null);
    assert.equal(sanitizeRelativeNext(""), null);
    assert.equal(sanitizeRelativeNext(null), null);
  });

  it("rejects control characters and encoded slash/backslash tricks", () => {
    assert.equal(sanitizeRelativeNext("/os\n/admin"), null);
    assert.equal(sanitizeRelativeNext("/os%2f%2fevil.com"), null);
    assert.equal(sanitizeRelativeNext("/%2F%2Fevil.com"), null);
    assert.equal(sanitizeRelativeNext("/os%5cwindows"), null);
    assert.equal(sanitizeRelativeNext("/os%252f%252fevil"), null);
    assert.equal(sanitizeRelativeNext("/os%255cevil"), null);
  });

  it("rejects overlong values", () => {
    assert.equal(sanitizeRelativeNext(`/${"a".repeat(MAX_RELATIVE_NEXT_LENGTH)}`), null);
  });
});

describe("trusted portal origins", () => {
  it("accepts exact production origins only", () => {
    assert.equal(parseTrustedPortalOrigin("https://admin.rinads.com/tenants"), PRODUCTION_PORTAL_ORIGINS.platform);
    assert.equal(parseTrustedPortalOrigin("https://app.rinads.com"), PRODUCTION_PORTAL_ORIGINS.owner);
    assert.equal(parseTrustedPortalOrigin("https://customers.rinads.com/"), PRODUCTION_PORTAL_ORIGINS.customer);
    assert.equal(parseTrustedPortalOrigin("https://glow.rinads.com"), PRODUCTION_PORTAL_ORIGINS.glow);
    assert.equal(parseTrustedPortalOrigin(CANONICAL_AUTH_ORIGIN), PRODUCTION_PORTAL_ORIGINS.website);
  });

  it("rejects lookalikes, http, credentials, and suffixes", () => {
    assert.equal(parseTrustedPortalOrigin("https://admin.rinads.com.evil.com"), null);
    assert.equal(parseTrustedPortalOrigin("https://evil-admin.rinads.com"), null);
    assert.equal(parseTrustedPortalOrigin("http://admin.rinads.com"), null);
    assert.equal(parseTrustedPortalOrigin("https://user:pass@admin.rinads.com"), null);
    assert.equal(parseTrustedPortalOrigin("https://admin.rinads.com.attacker"), null);
    assert.equal(parseTrustedPortalOrigin("//admin.rinads.com"), null);
  });

  it("parses exact allowlisted destinations", () => {
    assert.equal(
      parseTrustedPortalDestination("https://app.rinads.com/operations?x=1"),
      "https://app.rinads.com/operations?x=1"
    );
    assert.equal(parseTrustedPortalDestination("https://app.rinads.com.evil/operations"), null);
    assert.equal(parseTrustedPortalDestination("http://localhost:3003/operations"), null);
  });
});

describe("cookie production flag", () => {
  it("uses VERCEL_ENV=production for shared domain cookies", () => {
    const options = getSharedAuthCookieOptions({ VERCEL_ENV: "production", NODE_ENV: "development" });
    assert.equal(isProductionCookieEnv({ VERCEL_ENV: "production", NODE_ENV: "development" }), true);
    assert.equal(options.domain, AUTH_COOKIE_DOMAIN);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, "lax");
  });

  it("keeps preview cookies host-only even if NODE_ENV=production", () => {
    assert.equal(isProductionCookieEnv({ VERCEL_ENV: "preview", NODE_ENV: "production" }), false);
    const options = getSharedAuthCookieOptions({ VERCEL_ENV: "preview", NODE_ENV: "production" });
    assert.equal(options.domain, undefined);
    assert.equal(options.secure, true);
  });

  it("falls back to NODE_ENV only when VERCEL_ENV is absent", () => {
    assert.equal(isProductionCookieEnv({ NODE_ENV: "production" }), true);
    assert.equal(isProductionCookieEnv({ NODE_ENV: "development" }), false);
    const options = getSharedAuthCookieOptions({ NODE_ENV: "production" });
    assert.equal(options.domain, AUTH_COOKIE_DOMAIN);
  });
});

describe("development demo bypass", () => {
  it("allows only explicit development flags", () => {
    assert.equal(isDevelopmentRuntime({ VERCEL_ENV: "development" }), true);
    assert.equal(allowDevelopmentAuthBypass({ VERCEL_ENV: "development", USE_DEMO_STORE: "1" }), true);
    assert.equal(allowDevelopmentAuthBypass({ VERCEL_ENV: "development" }), false);
    assert.equal(allowDevelopmentAuthBypass({ VERCEL_ENV: "preview", USE_DEMO_STORE: "1" }), false);
    assert.equal(allowDevelopmentAuthBypass({ VERCEL_ENV: "production", USE_DEMO_STORE: "1" }), false);
    assert.equal(allowDevelopmentAuthBypass({ NODE_ENV: "development", NEXT_PUBLIC_PLATFORM_DEMO: "1" }), true);
  });
});

describe("auth callback destination", () => {
  it("accepts local paths or exact portal destinations", () => {
    assert.equal(resolveAuthCallbackDestination("/auth/reset-password"), "/auth/reset-password");
    assert.equal(
      resolveAuthCallbackDestination("https://admin.rinads.com/tenants"),
      "https://admin.rinads.com/tenants"
    );
    assert.equal(resolveAuthCallbackDestination("https://evil.com"), "/");
    assert.equal(resolveAuthCallbackDestination("//admin.rinads.com"), "/");
    assert.equal(resolveAuthCallbackDestination("https://app.rinads.com.evil/"), "/");
  });

  it("detects code and invite/recovery grants", () => {
    assert.equal(hasAuthCallbackGrant({ code: "abc" }), true);
    assert.equal(hasAuthCallbackGrant({ tokenHash: "t", type: "invite" }), true);
    assert.equal(hasAuthCallbackGrant({ tokenHash: "t", type: "recovery" }), true);
    assert.equal(hasAuthCallbackGrant({ tokenHash: "t", type: "other" }), false);
    assert.equal(parseRecoveryOtpType("invite"), "invite");
    assert.equal(parseRecoveryOtpType("sms"), null);
  });
});

describe("portal middleware decisions", () => {
  it("redirects unauthenticated users to login with sanitized next", () => {
    const decision = resolvePortalMiddlewareDecision({
      pathname: "/tenants",
      search: "?x=1",
      isAuthenticated: false,
    });
    assert.equal(decision.type, "redirect");
    if (decision.type === "redirect") {
      assert.equal(decision.to, "/login?next=%2Ftenants%3Fx%3D1");
    }
  });

  it("keeps health, login, forbidden, and extra public paths open", () => {
    assert.equal(
      resolvePortalMiddlewareDecision({
        pathname: "/api/health",
        isAuthenticated: false,
      }).type,
      "next"
    );
    assert.equal(
      resolvePortalMiddlewareDecision({
        pathname: "/api/webhooks/razorpay",
        isAuthenticated: false,
        extraPublicPaths: ["/api/webhooks/razorpay"],
      }).type,
      "next"
    );
    assert.equal(
      resolvePortalMiddlewareDecision({
        pathname: "/login",
        isAuthenticated: false,
      }).type,
      "next"
    );
  });

  it("sends authenticated login visits to the default path", () => {
    const decision = resolvePortalMiddlewareDecision({
      pathname: "/login",
      search: "?next=/operations",
      isAuthenticated: true,
    });
    assert.deepEqual(decision, { type: "redirect", to: "/operations" });
  });

  it("builds login redirects without protocol-relative next values", () => {
    assert.equal(buildLoginRedirectPath("//evil.com"), "/login?next=%2F");
  });
});

describe("role-aware portal URLs", () => {
  it("uses production domains in production and localhost only in dev", () => {
    const prod = getPortalUrlMap({ VERCEL_ENV: "production" });
    assert.equal(prod.platform, "https://admin.rinads.com");
    assert.equal(prod.owner, "https://app.rinads.com");
    assert.equal(prod.customer, "https://customers.rinads.com");
    assert.equal(prod.glow, "https://glow.rinads.com");

    const dev = getPortalUrlMap({ NODE_ENV: "development" });
    assert.equal(dev.platform, "http://localhost:3004");
    assert.equal(dev.owner, "http://localhost:3003");
    assert.equal(dev.customer, "http://localhost:3002");

    const ignoredProdInDev = getPortalUrlMap({
      NODE_ENV: "development",
      NEXT_PUBLIC_PLATFORM_ADMIN_URL: "https://admin.rinads.com",
    });
    assert.equal(ignoredProdInDev.platform, "http://localhost:3004");

    const preview = getPortalUrlMap({
      VERCEL_ENV: "preview",
      NODE_ENV: "production",
    });
    assert.equal(preview.platform, "https://admin.rinads.com");
    assert.equal(preview.owner, "https://app.rinads.com");
  });

  it("exposes platform only to privileged, owner to staff, customer to clients", () => {
    assert.deepEqual(
      getVisiblePortalLinks({
        privileged: true,
        ownerStaff: true,
        customer: false,
        urls: getPortalUrlMap({ VERCEL_ENV: "production" }),
      }).map((l) => l.key),
      ["platform", "owner"]
    );
    assert.deepEqual(
      getVisiblePortalLinks({
        privileged: false,
        ownerStaff: true,
        customer: false,
        urls: getPortalUrlMap({ VERCEL_ENV: "production" }),
      }).map((l) => l.key),
      ["owner"]
    );
    assert.deepEqual(
      getVisiblePortalLinks({
        privileged: false,
        ownerStaff: false,
        customer: true,
        urls: getPortalUrlMap({ VERCEL_ENV: "production" }),
      }),
      [{ key: "customer", href: "https://customers.rinads.com" }]
    );
    assert.equal(portalUrl("https://app.rinads.com", "operations"), "https://app.rinads.com/operations");
  });
});

function mockAuth(overrides: Partial<SupabaseAuthApi["auth"]> = {}): SupabaseAuthApi {
  return {
    auth: {
      signInWithPassword: async () => ({ data: { session: null }, error: { message: "unused" } }),
      signUp: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      ...overrides,
    },
  };
}

describe("supabase wrappers", () => {
  it("never reveals whether a reset account exists", async () => {
    const missing = mockAuth({
      resetPasswordForEmail: async () => ({ data: null, error: { message: "User not found" } }),
    });
    const present = mockAuth({
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
    });
    assert.deepEqual(await requestPasswordReset(missing, "a@b.c"), { error: null });
    assert.deepEqual(await requestPasswordReset(present, "a@b.c"), { error: null });
    assert.match(PASSWORD_RESET_GENERIC_MESSAGE, /If an account exists/);
  });

  it("exchanges codes and verifies invite/recovery OTPs", async () => {
    const session = {
      access_token: "tok",
      expires_at: Math.floor(Date.now() / 1000) + 60,
      user: { id: "u1", email: "a@b.c" },
    };
    const client = mockAuth({
      exchangeCodeForSession: async () => ({ data: { session }, error: null }),
      verifyOtp: async () => ({ data: { session }, error: null }),
      updateUser: async () => ({ data: { user: session.user }, error: null }),
    });
    const exchanged = await exchangeCodeForSession(client, "code");
    assert.equal(exchanged.error, null);
    assert.equal(exchanged.session?.user.id, "u1");
    const verified = await verifyOtpToken(client, { tokenHash: "hash", type: "invite" });
    assert.equal(verified.session?.user.email, "a@b.c");
    assert.deepEqual(await updatePassword(client, "new-pass-word"), { error: null });
  });
});
