import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerAction, clearActionRegistry } from "../src/actions/registry";
import { executeAction, validateActionExecution, requiresApproval } from "../src/actions/executor";

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

  it("fails closed when a handler reports success but postcondition verification fails", async () => {
    clearActionRegistry();
    registerAction({
      key: "test.create",
      description: "Test verified action",
      riskLevel: "LOW",
      idempotencyRequired: true,
      handler: async () => ({ ok: true, data: { id: "created_1" } }),
      verify: async () => ({
        ok: false,
        error: "Expected record was not found",
      }),
    });

    const result = await executeAction({ organizationId: "org_a" }, "test.create", {});
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.errorClass, "verification_error");
      assert.match(result.error, /not found/i);
    }
  });

  it("returns success only after a registered postcondition verifier passes", async () => {
    clearActionRegistry();
    registerAction({
      key: "test.verified",
      description: "Test verified success",
      riskLevel: "LOW",
      idempotencyRequired: true,
      handler: async () => ({ ok: true, data: { id: "created_2" } }),
      verify: (_ctx, _input, output) => ({ ok: output?.id === "created_2" }),
    });

    const result = await executeAction({ organizationId: "org_a" }, "test.verified", {});
    assert.equal(result.ok, true);
  });
});
