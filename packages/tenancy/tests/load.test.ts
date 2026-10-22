import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDemoTenancyContext,
  loadMemberships,
  resolveTenancyFromSupabase,
  type TenancySupabaseClient,
} from "../src/load";
import { requireOrgActive, requirePermission } from "../src/context";
import { planFeatureFlags } from "../src/feature-flags";
import { activeOrgCookieOptions, readActiveOrgIdFromCookie } from "../src/org-switch";

function queryResult(rows: Record<string, unknown>[], singleRow?: Record<string, unknown> | null) {
  const result = Promise.resolve({ data: rows, error: null }) as Promise<{
    data: Record<string, unknown>[];
    error: null;
  }> & {
    single: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
  };
  result.single = async () => ({ data: singleRow ?? rows[0] ?? null, error: null });
  return result;
}

function tenancyClient(input?: { rinpoOverride?: boolean }): TenancySupabaseClient {
  return {
    auth: {
      getUser: async () => ({
        data: { user: { id: "user_1", email: "owner@example.com" } },
        error: null,
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => {
          if (table === "organization_members") {
            return queryResult([
              {
                status: "active",
                organizations: {
                  id: "org_1",
                  name: "Salon One",
                  slug: "salon-one",
                  status: "active",
                },
                roles: { id: "role_owner", key: "owner" },
              },
            ]);
          }
          if (table === "role_permissions") return queryResult([]);
          if (table === "organization_subscriptions") {
            return queryResult([{ plan_key: "platform" }], { plan_key: "platform" });
          }
          if (table === "organization_settings") {
            return queryResult([{ vertical_key: "salon-os" }], { vertical_key: "salon-os" });
          }
          if (table === "feature_flag_overrides") {
            return queryResult(
              input?.rinpoOverride === undefined
                ? []
                : [
                    {
                      flag_key: "rinpo.ops",
                      organization_id: "org_1",
                      user_id: null,
                      enabled: input.rinpoOverride,
                    },
                  ],
            );
          }
          return queryResult([]);
        },
      }),
    }),
  } as TenancySupabaseClient;
}

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

  it("keeps platform plan defaults when no explicit feature override exists", async () => {
    const ctx = await resolveTenancyFromSupabase(tenancyClient());
    assert.ok(ctx);
    assert.equal(ctx?.planKey, "platform");
    assert.equal(ctx?.verticalKey, "salon-os");
    assert.equal(ctx?.featureFlags["erp.fulfilment"], true);
    assert.equal(ctx?.featureFlags["rinpo.ops"], true);
  });

  it("lets an explicit organization feature override win over the plan default", async () => {
    const ctx = await resolveTenancyFromSupabase(tenancyClient({ rinpoOverride: false }));
    assert.ok(ctx);
    assert.equal(ctx?.featureFlags["rinpo.ops"], false);
    assert.equal(ctx?.featureFlags["erp.fulfilment"], true);
  });
});
