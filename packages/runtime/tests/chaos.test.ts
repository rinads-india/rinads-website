import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRuntimeService } from "../src/runtime-service";
import { registerAction, clearActionRegistry } from "../src/actions/registry";

describe("Runtime chaos stubs", () => {
  it("survives duplicate workflow job enqueue", async () => {
    clearActionRegistry();
    registerAction({
      key: "fulfilment.create_from_order",
      description: "test",
      riskLevel: "MEDIUM",
      idempotencyRequired: true,
      handler: async () => ({ ok: true }),
    });
    registerAction({
      key: "notification.enqueue",
      description: "test",
      riskLevel: "LOW",
      idempotencyRequired: true,
      handler: async () => ({ ok: true }),
    });

    const runtime = createRuntimeService();
    runtime.initOrganization("org_a");
    runtime.handleOrderPaid({ organizationId: "org_a", orderId: "o_dup", lines: [] });
    runtime.handleOrderPaid({ organizationId: "org_a", orderId: "o_dup", lines: [] });
    assert.equal(runtime.getJobs("org_a").filter((j) => j.processorKey === "workflow_runner").length, 1);
  });
});
