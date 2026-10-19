import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OrgMembership } from "@rinads/tenancy";
import { resolveRinpoPhoneHome } from "../lib/rinpo-phone-home";

function membership(overrides: Partial<OrgMembership> = {}): OrgMembership {
  return {
    organizationId: "org-1",
    organizationName: "RINADS Demo Business",
    organizationSlug: "rinads-demo-business",
    organizationStatus: "active",
    roleKey: "manager",
    roleId: "role-manager",
    permissions: ["org.read", "tasks.manage", "commerce.order.read"],
    ...overrides,
  };
}

describe("RINPO Phone M1 home resolver", () => {
  it("returns a personal shell when no organisation membership is active", () => {
    const home = resolveRinpoPhoneHome({
      userId: "user-1",
      email: "andrino@example.com",
      memberships: [],
    });

    assert.equal(home.workspace.type, "personal");
    assert.deepEqual(home.dock, ["today", "rinpo", "world", "apps"]);
    assert.equal(home.apps.some((app) => app.id === "work"), false);
    assert.equal(home.security.visibilityOnly, true);
    assert.equal(home.security.authorization, "server-and-rls");
  });

  it("adds organisation apps without treating UI visibility as authorization", () => {
    const home = resolveRinpoPhoneHome({
      userId: "user-1",
      displayName: "Andrino",
      memberships: [membership()],
      activeOrganizationId: "org-1",
    });

    assert.equal(home.workspace.id, "org-1");
    assert.equal(home.workspace.roleKey, "manager");
    assert.deepEqual(home.dock, ["today", "rinpo", "work", "world", "apps"]);
    assert.equal(home.apps.some((app) => app.id === "customers"), true);
    assert.equal(home.apps.some((app) => app.id === "money"), true);
    assert.equal(home.apps.some((app) => app.id === "approvals"), true);
    assert.equal(home.apps.some((app) => app.id === "settings"), false);
    assert.equal(home.security.visibilityOnly, true);
  });

  it("limits viewer navigation to the base handset surfaces", () => {
    const home = resolveRinpoPhoneHome({
      userId: "user-2",
      memberships: [
        membership({
          roleKey: "viewer",
          roleId: "role-viewer",
          permissions: ["org.read"],
        }),
      ],
      activeOrganizationId: "org-1",
    });

    assert.deepEqual(home.dock, ["today", "rinpo", "world", "apps"]);
    assert.equal(home.apps.some((app) => app.id === "approvals"), false);
    assert.equal(home.apps.some((app) => app.id === "settings"), false);
  });

  it("does not expose suspended organisations as workspaces", () => {
    const home = resolveRinpoPhoneHome({
      userId: "user-3",
      memberships: [membership({ organizationStatus: "suspended" })],
      activeOrganizationId: "org-1",
    });

    assert.equal(home.workspace.type, "personal");
    assert.equal(home.workspaces.length, 1);
  });
});
