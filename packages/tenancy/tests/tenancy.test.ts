import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTenancyContext,
  requireOrgActive,
  requirePermission,
  toCommerceContext,
  evaluateFeatureFlags,
} from "../src/index";

describe("TenancyContext", () => {
  const memberships = [
    {
      organizationId: "org_a",
      organizationName: "Org A",
      organizationSlug: "org-a",
      organizationStatus: "active" as const,
      roleKey: "admin" as const,
      roleId: "role_admin",
      permissions: ["commerce.order.read" as const, "inventory.read" as const],
    },
    {
      organizationId: "org_b",
      organizationName: "Org B",
      organizationSlug: "org-b",
      organizationStatus: "active" as const,
      roleKey: "staff" as const,
      roleId: "role_staff",
      permissions: ["commerce.catalog.read" as const],
    },
  ];

  it("picks active org from cookie", () => {
    const ctx = buildTenancyContext({
      userId: "user_1",
      activeOrganizationId: "org_b",
      memberships,
    });
    assert.ok(ctx);
    assert.equal(ctx.organizationId, "org_b");
  });

  it("denies suspended org", () => {
    const ctx = buildTenancyContext({
      userId: "user_1",
      memberships: [{ ...memberships[0], organizationStatus: "suspended" }],
    })!;
    assert.ok(!requireOrgActive(ctx).allowed);
  });

  it("checks permissions", () => {
    const ctx = buildTenancyContext({ userId: "u", memberships })!;
    assert.ok(requirePermission(ctx, "inventory.read").allowed);
    assert.ok(!requirePermission(ctx, "platform.tenants.manage").allowed);
  });

  it("maps to commerce context", () => {
    const ctx = buildTenancyContext({ userId: "u", memberships })!;
    const commerce = toCommerceContext(ctx, "cust_1");
    assert.equal(commerce.organizationId, "org_a");
    assert.equal(commerce.customerId, "cust_1");
  });
});

describe("Feature flags", () => {
  it("applies org override", () => {
    const flags = evaluateFeatureFlags(
      [{ key: "erp.inventory", defaultEnabled: false }],
      [{ flagKey: "erp.inventory", organizationId: "org_a", enabled: true }],
      { organizationId: "org_a" }
    );
    assert.equal(flags["erp.inventory"], true);
  });
});
