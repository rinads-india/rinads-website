import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDemoTenancyContext,
  loadMemberships,
  type TenancySupabaseClient,
} from "../src/load";
import { requireOrgActive, requirePermission } from "../src/context";
import { planFeatureFlags } from "../src/feature-flags";
import { activeOrgCookieOptions, readActiveOrgIdFromCookie } from "../src/org-switch";

describe("tenancy load helpers", () => {
  it("builds demo context with plan flags", () => {
    const ctx = buildDemoTenancyContext();
    assert.equal(ctx.organizationSlug, "ambady");
    assert.ok(ctx.featureFlags["commerce.enabled"]);
  });

  it("denies suspended org access", () => {
    const ctx = buildDemoTenancyContext({ organizationStatus: "suspended" });
    const decision = requireOrgActive(ctx);
    assert.equal(decision.allowed, false);
  });

  it("enforces permission keys", () => {
    const ctx = buildDemoTenancyContext({ permissions: ["org.read"] });
    assert.equal(requirePermission(ctx, "org.manage").allowed, false);
    assert.equal(requirePermission(ctx, "org.read").allowed, true);
  });

  it("reads active org cookie", () => {
    assert.equal(readActiveOrgIdFromCookie(" org_abc "), "org_abc");
    assert.equal(readActiveOrgIdFromCookie(""), undefined);
  });

  it("keeps active-org HttpOnly while accepting an explicit shared scope", () => {
    const options = activeOrgCookieOptions("org_abc", {
      domain: ".rinads.com",
      secure: true,
    });
    assert.equal(options.httpOnly, true);
    assert.equal(options.domain, ".rinads.com");
    assert.equal(options.secure, true);
    assert.equal(activeOrgCookieOptions("org_local").domain, undefined);
  });

  it("maps plan to module flags", () => {
    const flags = planFeatureFlags({ planKey: "starter" });
    assert.equal(flags["erp.procurement"], false);
    assert.equal(flags["erp.inventory"], true);
    assert.equal(flags["salon.whatsapp.send_enabled"], false);
  });

  it("never returns invited or removed memberships as selectable tenancy contexts", async () => {
    const rows = [
      {
        status: "active",
        organizations: { id: "org_active", name: "Active Org", slug: "active", status: "active" },
        roles: { id: "role_staff", key: "staff" },
      },
      {
        status: "removed",
        organizations: { id: "org_removed", name: "Removed Org", slug: "removed", status: "active" },
        roles: { id: "role_staff", key: "staff" },
      },
      {
        status: "invited",
        organizations: { id: "org_invited", name: "Invited Org", slug: "invited", status: "active" },
        roles: { id: "role_staff", key: "staff" },
      },
    ];

    const client = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: async () => ({
            data: table === "organization_members" ? rows : [],
            error: null,
          }),
        }),
      }),
    } as unknown as TenancySupabaseClient;

    const memberships = await loadMemberships(client, "user_1");
    assert.deepEqual(memberships.map((membership) => membership.organizationId), ["org_active"]);
  });
});
