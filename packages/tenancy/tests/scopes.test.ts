import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertLocationScope,
  assertWorkspaceScope,
  locationBelongsToScope,
  workspaceBelongsToOrganization,
  type PlatformLocationScope,
  type WorkspaceScope,
} from "../src/scopes";

const workspaceA: WorkspaceScope = {
  id: "workspace-a",
  organizationId: "org-a",
  name: "Default",
  slug: "default",
  kind: "default",
  isDefault: true,
  status: "active",
};

const locationA: PlatformLocationScope = {
  id: "location-a",
  organizationId: "org-a",
  workspaceId: "workspace-a",
  name: "Main branch",
  code: "MAIN",
  kind: "branch",
  status: "active",
};

describe("workspace and location scope isolation", () => {
  it("accepts a workspace only inside its organization", () => {
    assert.equal(workspaceBelongsToOrganization(workspaceA, "org-a"), true);
    assert.equal(workspaceBelongsToOrganization(workspaceA, "org-b"), false);
    assert.doesNotThrow(() => assertWorkspaceScope(workspaceA, "org-a"));
    assert.throws(() => assertWorkspaceScope(workspaceA, "org-b"), /tenant scope mismatch/i);
  });

  it("rejects cross-organization location access even when workspace ids are supplied", () => {
    assert.equal(
      locationBelongsToScope(locationA, { organizationId: "org-b", workspaceId: "workspace-a" }),
      false,
    );
    assert.throws(
      () => assertLocationScope(locationA, { organizationId: "org-b", workspaceId: "workspace-a" }),
      /tenant scope mismatch/i,
    );
  });

  it("rejects a location from another workspace inside the same organization", () => {
    assert.equal(
      locationBelongsToScope(locationA, { organizationId: "org-a", workspaceId: "workspace-b" }),
      false,
    );
    assert.throws(
      () => assertLocationScope(locationA, { organizationId: "org-a", workspaceId: "workspace-b" }),
      /tenant scope mismatch/i,
    );
  });

  it("allows organization-level location scope when no workspace filter is requested", () => {
    assert.equal(locationBelongsToScope(locationA, { organizationId: "org-a" }), true);
    assert.doesNotThrow(() => assertLocationScope(locationA, { organizationId: "org-a" }));
  });
});
