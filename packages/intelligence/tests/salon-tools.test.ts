import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SalonRepository, RinpoActionsRepository, SalonNotificationService } from "@rinads/salon-server";
import { createSalonMockClient } from "./mock-salon-client";
import { executeSalonRinpoTool, resolveSalonRinpoAction, type SalonRinpoContext, type SalonRinpoDeps } from "../src/salon-tools";

const ORG_ID = "org_salon_1";

function makeDeps() {
  const client = createSalonMockClient();
  const repo = new SalonRepository(client);
  const actions = new RinpoActionsRepository(client);
  const notifications = new SalonNotificationService(client);
  return { deps: { repo, actions, notifications } as SalonRinpoDeps, client };
}

function ctxWith(permissions: string[], overrides: Partial<SalonRinpoContext> = {}): SalonRinpoContext {
  return { organizationId: ORG_ID, userId: "user_1", permissions, ...overrides };
}

async function seedBasics(repo: SalonRepository) {
  const branch = await repo.createBranch(ORG_ID, { name: "MG Road" });
  const staff = await repo.createStaff(ORG_ID, { displayName: "Asha" });
  const service = await repo.createService(ORG_ID, { name: "Haircut", durationMin: 30, price: 500 });
  if (!branch.ok || !staff.ok || !service.ok) throw new Error("seed failed");
  return { branch: branch.data, staff: staff.data, service: service.data };
}

describe("executeSalonRinpoTool — permission gating", () => {
  it("denies a READ tool when the caller lacks the required permission", async () => {
    const { deps } = makeDeps();
    const result = await executeSalonRinpoTool(deps, ctxWith([]), { tool: "get_salon_business_summary", args: {} });
    assert.equal(result.ok, false);
    assert.match(result.message, /Insufficient permissions/);
  });

  it("denies a WRITE tool when the caller lacks the required permission", async () => {
    const { deps } = makeDeps();
    const result = await executeSalonRinpoTool(deps, ctxWith([]), {
      tool: "create_appointment",
      args: { branchId: "b1", staffId: "s1", customerPhone: "999", serviceIds: "svc1", startsAt: "2026-09-10T10:00:00.000Z" },
    });
    assert.equal(result.ok, false);
    assert.match(result.message, /Insufficient permissions/);
  });

  it("allows a WRITE tool for a caller with the required permission", async () => {
    const { deps } = makeDeps();
    const { branch, staff, service } = await seedBasics(deps.repo);
    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "create_appointment",
      args: {
        branchId: branch.id,
        staffId: staff.id,
        customerPhone: "9876543210",
        serviceIds: service.id,
        startsAt: "2026-09-10T10:00:00.000Z",
      },
    });
    assert.equal(result.ok, true);
  });

  it("bypasses the permission check entirely for a privileged role (founder)", async () => {
    const { deps } = makeDeps();
    const result = await executeSalonRinpoTool(deps, ctxWith([], { roleKey: "founder" }), {
      tool: "get_salon_business_summary",
      args: {},
    });
    assert.equal(result.ok, true);
  });
});

describe("executeSalonRinpoTool — get_salon_business_summary (READ)", () => {
  it("returns a business summary with attention items derived from seeded data", async () => {
    const { deps } = makeDeps();
    const { branch, staff, service } = await seedBasics(deps.repo);
    const customer = await deps.repo.upsertCustomerByPhone(ORG_ID, { phone: "9876543210", name: "Priya" });
    assert.ok(customer.ok);
    if (!customer.ok) return;

    await deps.repo.createAppointment(ORG_ID, {
      branchId: branch.id,
      staffId: staff.id,
      customerId: customer.data.id,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      serviceIds: [service.id],
    });

    const result = await executeSalonRinpoTool(deps, ctxWith(["org.read"]), { tool: "get_salon_business_summary", args: {} });
    assert.equal(result.ok, true);
    const data = result.data as { todayAppointments: { total: number }; attentionItems: unknown[] };
    assert.equal(data.todayAppointments.total, 1);
    assert.ok(Array.isArray(data.attentionItems));
  });
});

describe("executeSalonRinpoTool — create_appointment (WRITE)", () => {
  it("books an appointment and upserts the customer by phone", async () => {
    const { deps } = makeDeps();
    const { branch, staff, service } = await seedBasics(deps.repo);

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "create_appointment",
      args: {
        branchId: branch.id,
        staffId: staff.id,
        customerPhone: "9998887777",
        customerName: "Neha",
        serviceIds: service.id,
        startsAt: "2026-09-11T10:00:00.000Z",
      },
    });
    assert.equal(result.ok, true);

    const customers = await deps.repo.listCustomers(ORG_ID);
    assert.ok(customers.ok);
    if (customers.ok) {
      assert.equal(customers.data.length, 1);
      assert.equal(customers.data[0].phone, "9998887777");
    }
  });
});

describe("executeSalonRinpoTool — sensitive tools create pending actions", () => {
  it("initiate_refund creates a pending rinpo_actions row with a linked refund, without changing sale status", async () => {
    const { deps } = makeDeps();
    const { branch } = await seedBasics(deps.repo);
    const sale = await deps.repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "initiate_refund",
      args: { saleId: sale.data.id, amount: 100, reason: "customer request" },
    });
    assert.equal(result.ok, true);
    const data = result.data as { actionId: string; status: string };
    assert.equal(data.status, "pending_approval");

    // The rinpo_actions row for initiate_refund is auto-marked "executed"
    // once its linked salon_refunds row is created — the refund's own
    // pending -> approved -> processed chain is the real approval surface
    // from here on (see salon-tools.ts's requestApproval comment).
    const refunds = await deps.repo.listRefunds(ORG_ID);
    assert.ok(refunds.ok);
    if (!refunds.ok) return;
    assert.equal(refunds.data.length, 1);
    assert.equal(refunds.data[0].status, "pending");
    assert.equal(refunds.data[0].amount, 100);

    const action = await deps.actions.get(data.actionId);
    assert.ok(action.ok);
    if (action.ok) {
      assert.equal(action.data.actionType, "initiate_refund");
      assert.equal(action.data.status, "executed");
      assert.equal(action.data.output?.refundId, refunds.data[0].id);
    }
  });

  it("modify_pricing creates a pending action without mutating the price immediately", async () => {
    const { deps } = makeDeps();
    const { service } = await seedBasics(deps.repo);

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "modify_pricing",
      args: { serviceId: service.id, newPrice: 750 },
    });
    assert.equal(result.ok, true);

    const services = await deps.repo.listServices(ORG_ID);
    assert.ok(services.ok);
    if (services.ok) assert.equal(services.data[0].price, 500); // unchanged until approved

    const pending = await deps.actions.listPending(ORG_ID);
    assert.ok(pending.ok);
    if (pending.ok) assert.equal(pending.data[0].actionType, "modify_pricing");
  });

  it("modify_discount creates a pending action without mutating the sale line immediately", async () => {
    const { deps } = makeDeps();
    const { branch } = await seedBasics(deps.repo);
    const sale = await deps.repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    const line = await deps.repo.addSaleLine(ORG_ID, sale.data.id, { description: "Haircut", unitPrice: 500 });
    assert.ok(line.ok);
    if (!line.ok) return;

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "modify_discount",
      args: { saleLineId: line.data.id, discountAmount: 50 },
    });
    assert.equal(result.ok, true);

    const lines = await deps.repo.listSaleLines(sale.data.id);
    assert.ok(lines.ok);
    if (lines.ok) assert.equal(lines.data[0].discountAmount, 0); // unchanged until approved
  });

  it("record_payment executes immediately without requiring approval", async () => {
    const { deps } = makeDeps();
    const { branch } = await seedBasics(deps.repo);
    const sale = await deps.repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    await deps.repo.addSaleLine(ORG_ID, sale.data.id, { description: "Haircut", unitPrice: 500 });
    await deps.repo.finalizeSale(ORG_ID, sale.data.id);

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "record_payment",
      args: { saleId: sale.data.id, method: "cash", amount: 500, idempotencyKey: "pay-1" },
    });
    assert.equal(result.ok, true);

    const pending = await deps.actions.listPending(ORG_ID);
    assert.ok(pending.ok);
    if (pending.ok) assert.equal(pending.data.length, 0);
  });
});

describe("resolveSalonRinpoAction", () => {
  it("approving modify_pricing applies the price change", async () => {
    const { deps } = makeDeps();
    const { service } = await seedBasics(deps.repo);

    const requested = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "modify_pricing",
      args: { serviceId: service.id, newPrice: 750 },
    });
    assert.equal(requested.ok, true);
    const actionId = (requested.data as { actionId: string }).actionId;

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), actionId, "approve");
    assert.equal(resolved.ok, true);

    const services = await deps.repo.listServices(ORG_ID);
    assert.ok(services.ok);
    if (services.ok) assert.equal(services.data[0].price, 750);
  });

  it("rejecting modify_pricing leaves the price unchanged and marks the action rejected", async () => {
    const { deps } = makeDeps();
    const { service } = await seedBasics(deps.repo);

    const requested = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "modify_pricing",
      args: { serviceId: service.id, newPrice: 999 },
    });
    const actionId = (requested.data as { actionId: string }).actionId;

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), actionId, "reject");
    assert.equal(resolved.ok, true);

    const services = await deps.repo.listServices(ORG_ID);
    assert.ok(services.ok);
    if (services.ok) assert.equal(services.data[0].price, 500);

    const action = await deps.actions.get(actionId);
    assert.ok(action.ok);
    if (action.ok) assert.equal(action.data.status, "rejected");
  });

  it("approving initiate_refund advances the linked refund to approved", async () => {
    const { deps } = makeDeps();
    const { branch } = await seedBasics(deps.repo);
    const sale = await deps.repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;

    const requested = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "initiate_refund",
      args: { saleId: sale.data.id, amount: 100, reason: "unhappy customer" },
    });
    const actionId = (requested.data as { actionId: string }).actionId;

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), actionId, "approve");
    assert.equal(resolved.ok, true);

    const refunds = await deps.repo.listRefunds(ORG_ID);
    assert.ok(refunds.ok);
    if (refunds.ok) assert.equal(refunds.data[0].status, "approved");
  });

  it("approving modify_discount applies the discount to the sale line", async () => {
    const { deps } = makeDeps();
    const { branch } = await seedBasics(deps.repo);
    const sale = await deps.repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    const line = await deps.repo.addSaleLine(ORG_ID, sale.data.id, { description: "Haircut", unitPrice: 500 });
    assert.ok(line.ok);
    if (!line.ok) return;

    const requested = await executeSalonRinpoTool(deps, ctxWith(["salon.pos.manage"]), {
      tool: "modify_discount",
      args: { saleLineId: line.data.id, discountAmount: 75 },
    });
    const actionId = (requested.data as { actionId: string }).actionId;

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), actionId, "approve");
    assert.equal(resolved.ok, true);

    const lines = await deps.repo.listSaleLines(sale.data.id);
    assert.ok(lines.ok);
    if (lines.ok) assert.equal(lines.data[0].discountAmount, 75);
  });
});
