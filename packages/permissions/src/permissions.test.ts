import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPrivilegedRoleKey, isOwnerStaffRoleKey, isCustomerRoleKey, decideAccess } from "./types";

describe("permissions", () => {
  it("marks founder and super_admin as privileged", () => {
    assert.equal(isPrivilegedRoleKey("founder"), true);
    assert.equal(isPrivilegedRoleKey("super_admin"), true);
    assert.equal(isPrivilegedRoleKey("admin"), false);
    assert.equal(isOwnerStaffRoleKey("staff"), true);
    assert.equal(isOwnerStaffRoleKey("client"), false);
    assert.equal(isCustomerRoleKey("client"), true);
    assert.equal(isCustomerRoleKey("admin"), false);
  });

  it("builds access decisions", () => {
    assert.deepEqual(decideAccess(true, "n/a"), { allowed: true });
    assert.deepEqual(decideAccess(false, "denied"), {
      allowed: false,
      reason: "denied",
    });
  });
});
