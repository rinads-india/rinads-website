import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SalonRepository,
  RinpoActionsRepository,
  SalonNotificationService,
  SalonCampaignsRepository,
  SalonAutomationService,
  SalonCommunicationsRepository,
  SalonLoyaltyRepository,
} from "@rinads/salon-server";
import { createSalonMockClient } from "./mock-salon-client";
import { executeSalonRinpoTool, resolveSalonRinpoAction, type SalonRinpoContext, type SalonRinpoDeps } from "../src/salon-tools";
import { DEFAULT_WEEKLY_HOURS } from "@rinads/salon";

const ORG_ID = "org_salon_1";

function makeDeps() {
  const client = createSalonMockClient();
  const repo = new SalonRepository(client);
  const actions = new RinpoActionsRepository(client);
  const notifications = new SalonNotificationService(client);
  const loyalty = new SalonLoyaltyRepository(client);
  const campaigns = new SalonCampaignsRepository(client, repo, notifications, loyalty);
  const automations = new SalonAutomationService(client, repo, notifications);
  const communications = new SalonCommunicationsRepository(client);
  return { deps: { repo, actions, notifications, campaigns, automations, communications, loyalty, client } as SalonRinpoDeps, client };
}

function ctxWith(permissions: string[], overrides: Partial<SalonRinpoContext> = {}): SalonRinpoContext {
  return { organizationId: ORG_ID, userId: "user_1", permissions, ...overrides };
}

async function seedBasics(repo: SalonRepository) {
  const branch = await repo.createBranch(ORG_ID, { name: "MG Road", workingHours: DEFAULT_WEEKLY_HOURS });
  if (!branch.ok) throw new Error("branch seed failed");
  const staff = await repo.createStaff(ORG_ID, { displayName: "Asha", branchId: branch.data.id, workingHours: DEFAULT_WEEKLY_HOURS });
  const service = await repo.createService(ORG_ID, { name: "Haircut", durationMin: 30, price: 500 });
  if (!branch.ok || !staff.ok || !service.ok) throw new Error("seed failed");
  return { branch: branch.data, staff: staff.data, service: service.data };
}

async function seedCustomerWithOneVisit(repo: SalonRepository, phone: string, amount: number) {
  const branch = await repo.createBranch(ORG_ID, { name: "Indiranagar" });
  if (!branch.ok) throw new Error("branch seed failed");
  const customer = await repo.upsertCustomerByPhone(ORG_ID, { phone });
  if (!customer.ok) throw new Error("customer seed failed");
  const sale = await repo.createSale(ORG_ID, { branchId: branch.data.id, customerId: customer.data.id });
  if (!sale.ok) throw new Error("sale seed failed");
  await repo.addSaleLine(ORG_ID, sale.data.id, { description: "Service", unitPrice: amount });
  await repo.finalizeSale(ORG_ID, sale.data.id);
  await repo.recordPayment(ORG_ID, sale.data.id, {
    method: "cash",
    amount,
    idempotencyKey: `seed-payment-${customer.data.id}`,
  });
  return customer.data;
}

function seedLoyalty(client: ReturnType<typeof createSalonMockClient>) {
  const customerId = "customer_loyalty";
  const accountId = "loyalty_account_1";
  client.tables.set("salon_loyalty_programs", [{
    id: "loyalty_program_1",
    organization_id: ORG_ID,
    name: "R GLOW Rewards",
    is_active: true,
    currency: "INR",
    earn_currency_units: 100,
    earn_points: 1,
    points_per_currency_unit: 10,
    tiers: [{ name: "Member", minimumPoints: 0 }],
  }]);
  client.tables.set("salon_loyalty_accounts", [{
    id: accountId,
    organization_id: ORG_ID,
    program_id: "loyalty_program_1",
    customer_id: customerId,
    lifetime_earned_points: 120,
  }]);
  client.tables.set("salon_loyalty_ledger_entries", [{
    id: "loyalty_ledger_1",
    organization_id: ORG_ID,
    account_id: accountId,
    entry_type: "earn",
    points: 120,
    idempotency_key: "loyalty-seed-1",
  }]);
  return { customerId, accountId };
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
        startsAt: "2099-09-10T10:00:00.000Z",
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

describe("executeSalonRinpoTool — review automation", () => {
  it("schedules one completed visit immediately without creating an approval", async () => {
    const { deps, client } = makeDeps();
    client.tables.set("salon_appointments", [{
      id: "appointment-review", organization_id: ORG_ID, branch_id: "branch-1", staff_id: "staff-1",
      customer_id: "customer-1", status: "completed",
      starts_at: "2026-09-16T08:00:00.000Z", ends_at: "2026-09-16T09:00:00.000Z",
    }]);
    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.reviews.manage"]), {
      tool: "schedule_review_request",
      args: { appointmentId: "appointment-review" },
    });
    assert.equal(result.ok, true);
    assert.equal(client.tables.get("salon_automation_runs")?.length, 1);
    assert.equal(client.tables.get("rinpo_actions")?.length ?? 0, 0);
  });

  it("returns review and recovery summaries as READ tools", async () => {
    const { deps } = makeDeps();
    const review = await executeSalonRinpoTool(deps, ctxWith(["org.read"]), {
      tool: "get_review_workflow_summary", args: {},
    });
    const recovery = await executeSalonRinpoTool(deps, ctxWith(["org.read"]), {
      tool: "get_recovery_summary", args: {},
    });
    assert.equal(review.ok, true);
    assert.equal(recovery.ok, true);
  });
});

describe("executeSalonRinpoTool — loyalty", () => {
  it("returns the organization liability and a customer's ledger history", async () => {
    const { deps, client } = makeDeps();
    const { customerId, accountId } = seedLoyalty(client);
    const summary = await executeSalonRinpoTool(deps, ctxWith(["salon.loyalty.view"]), {
      tool: "get_loyalty_summary",
      args: {},
    });
    assert.equal(summary.ok, true);
    assert.deepEqual(summary.data, {
      enrolledCustomers: 1,
      outstandingPoints: 120,
      currencyLiability: 12,
      currency: "INR",
    });

    const history = await executeSalonRinpoTool(deps, ctxWith(["salon.loyalty.view"]), {
      tool: "get_customer_loyalty_history",
      args: { customerId },
    });
    assert.equal(history.ok, true);
    const historyData = history.data as { account: { id: string }; balance: number; ledger: unknown[] };
    assert.equal(historyData.account.id, accountId);
    assert.equal(historyData.balance, 120);
    assert.equal(historyData.ledger.length, 1);
  });

  it("redeems and adjusts points only after approval resolution", async () => {
    const { deps, client } = makeDeps();
    const { customerId } = seedLoyalty(client);

    const redemptionRequest = await executeSalonRinpoTool(deps, ctxWith(["salon.loyalty.redeem"]), {
      tool: "redeem_loyalty_points",
      args: { customerId, saleId: "sale_loyalty", points: 20 },
    });
    assert.equal(redemptionRequest.ok, true);
    assert.equal(client.tables.get("salon_loyalty_redemptions")?.length ?? 0, 0);
    const redemption = await resolveSalonRinpoAction(
      deps,
      ctxWith(["org.manage"], { userId: "admin_1" }),
      (redemptionRequest.data as { actionId: string }).actionId,
      "approve"
    );
    assert.equal(redemption.ok, true);
    assert.equal(client.tables.get("salon_loyalty_redemptions")?.length, 1);

    const adjustmentRequest = await executeSalonRinpoTool(deps, ctxWith(["salon.loyalty.adjust"]), {
      tool: "adjust_loyalty_ledger",
      args: { customerId, points: -5, reason: "Correction" },
    });
    assert.equal(adjustmentRequest.ok, true);
    const adjustment = await resolveSalonRinpoAction(
      deps,
      ctxWith(["org.manage"], { userId: "admin_1" }),
      (adjustmentRequest.data as { actionId: string }).actionId,
      "approve"
    );
    assert.equal(adjustment.ok, true);
    assert.equal(client.tables.get("salon_loyalty_ledger_entries")?.length, 2);
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
        startsAt: "2099-09-11T10:00:00.000Z",
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

describe("executeSalonRinpoTool — growth READ/WRITE tools (R GLOW Phase E, Slice 1)", () => {
  it("denies create_segment for a caller without salon.campaigns.manage", async () => {
    const { deps } = makeDeps();
    const result = await executeSalonRinpoTool(deps, ctxWith(["org.read"]), {
      tool: "create_segment",
      args: { name: "All visitors", minVisits: 1 },
    });
    assert.equal(result.ok, false);
    assert.match(result.message, /Insufficient permissions/);
  });

  it("create_segment saves criteria built from flat args", async () => {
    const { deps } = makeDeps();
    await seedCustomerWithOneVisit(deps.repo, "9000000201", 500);

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "create_segment",
      args: { name: "All visitors", minVisits: 1 },
    });
    assert.equal(result.ok, true);

    const segments = await deps.campaigns.listSegments(ORG_ID);
    assert.ok(segments.ok);
    if (segments.ok) {
      assert.equal(segments.data.length, 1);
      assert.deepEqual(segments.data[0].criteria, { minVisits: 1 });
    }
  });

  it("create_campaign_draft drafts a campaign without sending anything", async () => {
    const { deps } = makeDeps();
    await seedCustomerWithOneVisit(deps.repo, "9000000202", 500);

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "create_campaign_draft",
      args: { name: "Spring offer", messageBody: "20% off this week!", minVisits: 1 },
    });
    assert.equal(result.ok, true);
    const data = result.data as { id: string; status: string };
    assert.equal(data.status, "draft");

    const campaigns = await deps.campaigns.listCampaigns(ORG_ID);
    assert.ok(campaigns.ok);
    if (campaigns.ok) assert.equal(campaigns.data.length, 1);
  });

  it("create_reactivation_draft builds a lastVisitBeforeDays criteria and marks the campaign type reactivation", async () => {
    const { deps } = makeDeps();
    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "create_reactivation_draft",
      args: { daysInactive: 60 },
    });
    assert.equal(result.ok, true);
    const data = result.data as { id: string; criteria: { lastVisitBeforeDays: number } };
    assert.equal(data.criteria.lastVisitBeforeDays, 60);

    const campaign = await deps.campaigns.getCampaign(data.id);
    assert.ok(campaign.ok);
    if (campaign.ok) assert.equal(campaign.data.campaignType, "reactivation");
  });

  it("preview_segment against a draft campaign returns eligible/excluded counts", async () => {
    const { deps } = makeDeps();
    await seedCustomerWithOneVisit(deps.repo, "9000000203", 500);
    await seedCustomerWithOneVisit(deps.repo, "9000000204", 5000);

    const draft = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "create_campaign_draft",
      args: { name: "High spenders", messageBody: "Thanks for your loyalty!", minLifetimeSpend: 1000 },
    });
    const campaignId = (draft.data as { id: string }).id;

    const preview = await executeSalonRinpoTool(deps, ctxWith(["org.read"]), {
      tool: "preview_segment",
      args: { campaignId },
    });
    assert.equal(preview.ok, true);
    const data = preview.data as { eligible: unknown[]; excluded: unknown[] };
    assert.equal(data.eligible.length, 1);
    assert.equal(data.excluded.length, 1);
  });

  it("get_customer_segments, get_campaign_performance, get_message_failures, get_retention_summary, and get_growth_opportunities all return honest empty results with no data", async () => {
    const { deps } = makeDeps();
    const ctx = ctxWith(["org.read"]);

    const segments = await executeSalonRinpoTool(deps, ctx, { tool: "get_customer_segments", args: {} });
    assert.equal(segments.ok, true);
    assert.deepEqual(segments.data, []);

    const performance = await executeSalonRinpoTool(deps, ctx, { tool: "get_campaign_performance", args: {} });
    assert.equal(performance.ok, true);
    assert.deepEqual(performance.data, []);

    const failures = await executeSalonRinpoTool(deps, ctx, { tool: "get_message_failures", args: {} });
    assert.equal(failures.ok, true);
    assert.deepEqual(failures.data, { failedCount: 0, deadLetterCount: 0, notConfiguredCount: 0 });

    const retention = await executeSalonRinpoTool(deps, ctx, { tool: "get_retention_summary", args: {} });
    assert.equal(retention.ok, true);
    assert.deepEqual(retention.data, { totalCustomersWithVisits: 0, repeatCustomers: 0, repeatRatePct: 0 });

    const opportunities = await executeSalonRinpoTool(deps, ctx, { tool: "get_growth_opportunities", args: {} });
    assert.equal(opportunities.ok, true);
    assert.deepEqual(opportunities.data, []);
  });
});

describe("executeSalonRinpoTool — growth SENSITIVE tools require approval", () => {
  async function draftAndApproveCampaign(deps: SalonRinpoDeps) {
    await seedCustomerWithOneVisit(deps.repo, "9000000301", 500);
    const draft = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "create_campaign_draft",
      args: { name: "Loyalty push", messageBody: "Thanks for visiting!", minVisits: 1 },
    });
    const campaignId = (draft.data as { id: string }).id;

    const approveRequest = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "approve_campaign",
      args: { campaignId },
    });
    const approveActionId = (approveRequest.data as { actionId: string }).actionId;
    await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), approveActionId, "approve");
    return campaignId;
  }

  it("approve_campaign creates a pending action and does not change campaign status until approved", async () => {
    const { deps } = makeDeps();
    await seedCustomerWithOneVisit(deps.repo, "9000000302", 500);
    const draft = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "create_campaign_draft",
      args: { name: "Weekend offer", messageBody: "Book this weekend!", minVisits: 1 },
    });
    const campaignId = (draft.data as { id: string }).id;

    const result = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "approve_campaign",
      args: { campaignId },
    });
    assert.equal(result.ok, true);
    const data = result.data as { actionId: string; status: string };
    assert.equal(data.status, "pending_approval");

    const campaign = await deps.campaigns.getCampaign(campaignId);
    assert.ok(campaign.ok);
    if (campaign.ok) assert.equal(campaign.data.status, "draft");

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), data.actionId, "approve");
    assert.equal(resolved.ok, true);

    const afterApproval = await deps.campaigns.getCampaign(campaignId);
    assert.ok(afterApproval.ok);
    if (afterApproval.ok) assert.equal(afterApproval.data.status, "approved");
  });

  it("send_campaign requires approval, then queues eligible recipients once resolved", async () => {
    const { deps } = makeDeps();
    const campaignId = await draftAndApproveCampaign(deps);

    const sendRequest = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "send_campaign",
      args: { campaignId },
    });
    assert.equal(sendRequest.ok, true);
    const sendActionId = (sendRequest.data as { actionId: string }).actionId;

    const campaignBeforeResolve = await deps.campaigns.getCampaign(campaignId);
    assert.ok(campaignBeforeResolve.ok);
    if (campaignBeforeResolve.ok) assert.equal(campaignBeforeResolve.data.status, "approved");

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), sendActionId, "approve");
    assert.equal(resolved.ok, true);

    const recipients = await deps.campaigns.listRecipients(campaignId);
    assert.ok(recipients.ok);
    if (recipients.ok) assert.equal(recipients.data.length, 1);
  });

  it("retry_failed_message requires approval, then resets a dead-lettered message to pending", async () => {
    const { deps, client } = makeDeps();
    const customer = await seedCustomerWithOneVisit(deps.repo, "9000000303", 500);
    const enqueueResult = await deps.notifications.enqueue({
      organizationId: ORG_ID,
      event: "customer.reactivation_due",
      recipientPhone: customer.phone,
      preferredChannel: customer.preferredChannel,
      payload: {},
      idempotencyKey: "retry-test-1",
    });
    assert.ok(enqueueResult.ok);
    if (!enqueueResult.ok || enqueueResult.data.skipped) return;
    const outboxId = enqueueResult.data.outboxId;
    await client.from("notification_outbox").update({ status: "dead_letter", last_error: "boom" }).eq("id", outboxId);

    const retryRequest = await executeSalonRinpoTool(deps, ctxWith(["salon.campaigns.manage"]), {
      tool: "retry_failed_message",
      args: { notificationOutboxId: outboxId },
    });
    assert.equal(retryRequest.ok, true);
    const actionId = (retryRequest.data as { actionId: string }).actionId;

    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), actionId, "approve");
    assert.equal(resolved.ok, true);

    const { data } = await client.from("notification_outbox").select("*").eq("id", outboxId).maybeSingle();
    assert.equal((data as { status: string } | null)?.status, "pending");
  });

  it("retry_failed_message_batch previews and waits for approval before bounded execution", async () => {
    const { deps, client } = makeDeps();
    const campaignId = "campaign_bulk_retry";
    const { data: recipients } = await client.from("salon_campaign_recipients").insert({
      organization_id: ORG_ID,
      campaign_id: campaignId,
      customer_id: "customer_bulk",
      status: "failed",
    });
    const { data: outbox } = await client.from("notification_outbox").insert({
      organization_id: ORG_ID,
      channel: "whatsapp",
      template_key: "salon.campaign.message",
      recipient: "+919000009999",
      payload: {},
      idempotency_key: "bulk-retry",
      campaign_recipient_id: recipients![0].id,
      status: "dead_letter",
      attempts: 5,
    });

    const requested = await executeSalonRinpoTool(deps, ctxWith(["salon.communications.retry"]), {
      tool: "retry_failed_message_batch",
      args: { campaignId, limit: 10 },
    });
    assert.equal(requested.ok, true);
    assert.equal(client.tables.get("notification_outbox")![0].status, "dead_letter");

    const actionId = (requested.data as { actionId: string }).actionId;
    const resolved = await resolveSalonRinpoAction(deps, ctxWith(["org.manage"], { userId: "admin_1" }), actionId, "approve");
    assert.equal(resolved.ok, true);
    assert.equal(client.tables.get("notification_outbox")!.find((row) => row.id === outbox![0].id)?.status, "pending");
  });
});
