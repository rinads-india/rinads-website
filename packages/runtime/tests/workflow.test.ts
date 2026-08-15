import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRuntimeService } from "../src/runtime-service";
import { registerAction, clearActionRegistry } from "../src/actions/registry";

describe("Workflow engine", () => {
  it("runs order.paid workflow end-to-end", async () => {
    clearActionRegistry();
    let fulfilmentCalled = false;
    registerAction({
      key: "fulfilment.create_from_order",
      description: "test",
      riskLevel: "MEDIUM",
      idempotencyRequired: true,
      handler: async () => {
        fulfilmentCalled = true;
        return { ok: true, data: { fulfilmentId: "ff_1" } };
      },
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
    const { executionId } = runtime.handleOrderPaid({
      organizationId: "org_a",
      orderId: "ord_1",
      lines: [{ sku: "SKU", productName: "P", variantName: "V", quantity: 1 }],
    });
    assert.ok(executionId);

    await runtime.processQueue({
      organizationId: "org_a",
      permissions: ["org.manage"],
    });

    assert.equal(fulfilmentCalled, true);
    const execution = runtime.getExecution(executionId!);
    assert.equal(execution?.status, "completed");
  });

  it("waits for approval on HIGH risk steps", async () => {
    clearActionRegistry();
    registerAction({
      key: "refund.process",
      description: "refund",
      riskLevel: "CRITICAL",
      idempotencyRequired: true,
      requiredPermission: "org.manage",
      handler: async () => ({ ok: true }),
    });

    const runtime = createRuntimeService();
    runtime.initOrganization("org_b");
    runtime.store.executions.push({
      id: "wfx_test",
      organizationId: "org_b",
      workflowKey: "refund-v1",
      status: "queued",
      correlationId: "corr_1",
      inputPayload: { amount: 9000 },
      stepRuns: [
        {
          id: "step_1",
          stepKey: "refund",
          actionKey: "refund.process",
          status: "pending",
          attemptCount: 0,
        },
      ],
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    runtime.store.jobs.push({
      id: "job_1",
      organizationId: "org_b",
      processorKey: "workflow_runner",
      idempotencyKey: "wf:1",
      payload: { executionId: "wfx_test" },
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      runAfter: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await runtime.processQueue({ organizationId: "org_b", permissions: ["org.manage"] });
    const execution = runtime.getExecution("wfx_test");
    assert.equal(execution?.status, "waiting");
    const approval = runtime.listApprovals("org_b")[0]!;
    runtime.approve(approval.id, "owner");
    await runtime.processQueue({ organizationId: "org_b", permissions: ["org.manage"] });
    assert.equal(runtime.getExecution("wfx_test")?.status, "completed");
  });
});
