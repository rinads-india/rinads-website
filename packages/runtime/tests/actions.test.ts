import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerAction, clearActionRegistry } from "../src/actions/registry";
import { validateActionExecution, requiresApproval } from "../src/actions/executor";

describe("Action registry", () => {
  it("blocks unregistered actions", () => {
    clearActionRegistry();
    const result = validateActionExecution({ organizationId: "org_a" }, "unknown.action");
    assert.equal(result.allowed, false);
  });

  it("enforces permission metadata", () => {
    clearActionRegistry();
    registerAction({
      key: "task.create",
      description: "Create task",
      riskLevel: "LOW",
      idempotencyRequired: true,
      requiredPermission: "org.manage",
      handler: async () => ({ ok: true }),
    });
    const denied = validateActionExecution({ organizationId: "org_a" }, "task.create");
    assert.equal(denied.allowed, false);
    const allowed = validateActionExecution(
      { organizationId: "org_a", permissions: ["org.manage"] },
      "task.create"
    );
    assert.equal(allowed.allowed, true);
  });

  it("classifies approval threshold by risk", () => {
    assert.equal(requiresApproval("LOW", "HIGH"), false);
    assert.equal(requiresApproval("HIGH", "HIGH"), true);
    assert.equal(requiresApproval("CRITICAL", "HIGH"), true);
  });
});
