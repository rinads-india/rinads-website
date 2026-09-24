import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  capabilityTierFromDemoRole,
  capabilityTierFromRoleKey,
  tierAtLeast,
} from "../lib/os-org-role";
import {
  filterDestinationsForCapability,
  getAutomateModuleDestinations,
  getGrowthModuleDestinations,
  getMoneyModuleDestinations,
  getSettingsModuleDestinations,
  getWorkModuleDestinations,
} from "../lib/os-module-destinations";
import {
  getOsDesktopNavItems,
  getOsMobileMoreNavItems,
  osNavContainsDashboardLabel,
} from "../lib/os-nav";
import { sanitizeOsLoginNext } from "../lib/os-shell-access";
import { ONBOARDING_PATH, OS_PATH, resolveTenantAwareDestination } from "../lib/post-auth-destination";

const active = (organizationId: string) => ({
  organizationId,
  organizationStatus: "active" as const,
});

describe("sanitizeOsLoginNext", () => {
  it("allows Business OS and onboarding return paths only", () => {
    assert.equal(sanitizeOsLoginNext("/os"), "/os");
    assert.equal(sanitizeOsLoginNext("/os/work"), "/os/work");
    assert.equal(sanitizeOsLoginNext("/onboarding/create-organization"), ONBOARDING_PATH);
  });

  it("blocks open redirects and unrelated paths", () => {
    assert.equal(sanitizeOsLoginNext("//evil.com"), OS_PATH);
    assert.equal(sanitizeOsLoginNext("https://evil.com"), OS_PATH);
    assert.equal(sanitizeOsLoginNext("/signup"), OS_PATH);
    assert.equal(sanitizeOsLoginNext(null), OS_PATH);
  });
});

describe("os-org-role adapter", () => {
  it("maps membership RoleKey to capability tiers", () => {
    assert.equal(capabilityTierFromRoleKey("client"), "client");
    assert.equal(capabilityTierFromRoleKey("staff"), "staff");
    assert.equal(capabilityTierFromRoleKey("admin"), "admin");
    assert.equal(capabilityTierFromRoleKey("founder"), "admin");
    assert.equal(capabilityTierFromRoleKey(null), null);
  });

  it("maps demo roles without inventing founder access", () => {
    assert.equal(capabilityTierFromDemoRole("client"), "client");
    assert.equal(capabilityTierFromDemoRole("staff"), "staff");
    assert.equal(capabilityTierFromDemoRole("admin"), "admin");
    assert.equal(capabilityTierFromDemoRole("founder"), null);
  });

  it("compares tiers", () => {
    assert.equal(tierAtLeast("staff", "staff"), true);
    assert.equal(tierAtLeast("client", "staff"), false);
    assert.equal(tierAtLeast(null, "client"), false);
  });
});

describe("role-aware destinations", () => {
  it("hides owner portal money links from clients", () => {
    const money = filterDestinationsForCapability(
      getMoneyModuleDestinations().destinations,
      "client"
    );
    assert.ok(!money.some((d) => d.id === "billing-settings"));
    assert.ok(!money.some((d) => d.id === "orders"));
  });

  it("allows staff money orders but not billing", () => {
    const money = filterDestinationsForCapability(
      getMoneyModuleDestinations().destinations,
      "staff"
    );
    assert.ok(money.some((d) => d.id === "orders" && d.status === "available"));
    assert.ok(!money.some((d) => d.id === "billing-settings"));
  });

  it("allows admin settings and billing", () => {
    const settings = filterDestinationsForCapability(
      getSettingsModuleDestinations().destinations,
      "admin"
    );
    assert.ok(settings.some((d) => d.id === "billing"));
    assert.ok(settings.some((d) => d.id === "domains"));
  });

  it("marks growth/automate overviews as public pages not Available product surfaces", () => {
    const growth = getGrowthModuleDestinations().destinations.find((d) => d.id === "marketing-os");
    const automate = getAutomateModuleDestinations().destinations.find(
      (d) => d.id === "automation-os"
    );
    assert.equal(growth?.status, "external_public");
    assert.equal(automate?.status, "external_public");
  });

  it("hides privileged work ops for unresolved role; keeps in-shell client routes", () => {
    const work = filterDestinationsForCapability(getWorkModuleDestinations().destinations, null);
    assert.ok(work.some((d) => d.id === "projects"));
    assert.ok(!work.some((d) => d.id === "owner-tasks"));
  });

  it("does not expose platform-admin URLs in module destinations", () => {
    const sources = [
      getWorkModuleDestinations(),
      getMoneyModuleDestinations(),
      getAutomateModuleDestinations(),
      getSettingsModuleDestinations(),
    ];
    for (const config of sources) {
      for (const dest of config.destinations) {
        assert.ok(!dest.href?.includes(":3004"), `${dest.id} must not link platform-admin`);
      }
    }
  });
});

describe("role-aware nav", () => {
  it("hides Money from clients and Settings from non-admins", () => {
    const clientDesktop = getOsDesktopNavItems("client");
    assert.ok(!clientDesktop.some((i) => i.id === "money"));
    assert.equal(osNavContainsDashboardLabel(clientDesktop), false);

    const staffMore = getOsMobileMoreNavItems("staff");
    assert.ok(staffMore.some((i) => i.id === "money"));
    assert.ok(!staffMore.some((i) => i.id === "settings"));

    const adminMore = getOsMobileMoreNavItems("admin");
    assert.ok(adminMore.some((i) => i.id === "settings"));
  });
});

describe("tenant routing scenarios for OS access", () => {
  it("sends no membership to onboarding", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [],
        settingsByOrganizationId: {},
      }),
      ONBOARDING_PATH
    );
  });

  it("keeps invalid active org cookie on /os when multi-org", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [active("one"), active("two")],
        activeOrgCookie: "not-a-member",
        settingsByOrganizationId: {
          one: { verticalKey: "generic-retail" },
          two: { verticalKey: "generic-retail" },
        },
      }),
      OS_PATH
    );
  });

  it("routes salon tenant to Rinaglow when configured", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [active("salon")],
        settingsByOrganizationId: { salon: { verticalKey: "salon-os" } },
        rinaglowUrl: "https://glow.rinads.com",
        production: true,
        authCookieDomain: ".rinads.com",
      }),
      "https://glow.rinads.com/calendar"
    );
  });

  it("does not cross-route to another org's salon destination without cookie", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [active("retail"), active("salon")],
        activeOrgCookie: "retail",
        settingsByOrganizationId: {
          retail: { verticalKey: "generic-retail" },
          salon: { verticalKey: "salon-os" },
        },
        rinaglowUrl: "https://glow.rinads.com",
        production: true,
        authCookieDomain: ".rinads.com",
      }),
      OS_PATH
    );
  });
});

describe("os shell access + mobile a11y source contracts", () => {
  it("wires layout to requireOsShellAccess and middleware pathname header", () => {
    const layout = readFileSync(join(process.cwd(), "app/os/layout.tsx"), "utf8");
    const middleware = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
    const access = readFileSync(join(process.cwd(), "lib/os-shell-access.ts"), "utf8");
    assert.match(layout, /requireOsShellAccess/);
    assert.match(middleware, /x-rinads-pathname/);
    assert.match(access, /loadMemberships/);
    assert.match(access, /ensureActiveOrganizationCookieAction/);
  });

  it("implements More dialog focus trap, restore, scroll lock, and Escape", () => {
    const source = readFileSync(
      join(process.cwd(), "components/os/BusinessOSMobileNav.tsx"),
      "utf8"
    );
    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /aria-haspopup="dialog"/);
    assert.match(source, /Escape/);
    assert.match(source, /document\.body\.style\.overflow/);
    assert.match(source, /\.focus\(/);
    assert.match(source, /shiftKey/);
    assert.match(source, /["']Tab["']/);
    assert.match(source, /previouslyFocusedRef|moreButtonRef/);
  });

  it("keeps /bos compatibility redirects", () => {
    const source = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    assert.match(source, /source: "\/bos"/);
    assert.match(source, /destination: "\/os"/);
    assert.match(source, /source: "\/bos\/:path\*"/);
  });

  it("does not trust AuthContext placeholder role for membership bridge gating", () => {
    const provider = readFileSync(
      join(process.cwd(), "components/os/OsOrgRoleProvider.tsx"),
      "utf8"
    );
    assert.match(provider, /membershipResolved/);
    assert.match(provider, /user\?\.demo/);
    assert.match(provider, /buildMembershipRoleView/);
    assert.match(provider, /buildDemoRoleView/);
  });
});
