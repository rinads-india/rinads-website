import { describe, it, beforeEach } from "node:test";
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
import { DEFAULT_WEEKLY_HOURS } from "@rinads/salon";
import { createSalonMockClient } from "./mock-salon-client";
import {
  executeSalonRinpoTool,
  resolveSalonRinpoAction,
  type SalonRinpoContext,
  type SalonRinpoDeps,
} from "../src/salon-tools";
import {
  getRinpoObservationSnapshot,
  resetRinpoObservationsForTests,
} from "../src/observability";
import { getRinpoTool } from "../src/registry";

const ORG_ID = "org_salon_pilot";

function makeDeps() {
  const client = createSalonMockClient();
  const repo = new SalonRepository(client);
  const actions = new RinpoActionsRepository(client);
  const notifications = new SalonNotificationService(client);
  const loyalty = new SalonLoyaltyRepository(client);
  const campaigns = new SalonCampaignsRepository(client, repo, notifications, loyalty);
  const automations = new SalonAutomationService(client, repo, notifications);
  const communications = new SalonCommunicationsRepository(client);
  return {
    deps: { repo, actions, notifications, campaigns, automations, communications, loyalty, client } as SalonRinpoDeps,
    client,
  };
}

function staffCtx(): SalonRinpoContext {
  return {
    organizationId: ORG_ID,
    userId: "user_staff",
    roleKey: "manager",
    permissions: ["salon.pos.manage", "org.manage"],
  };
}

describe("appointment confirmation pilot", () => {
  beforeEach(() => {
    resetRinpoObservationsForTests();
  });

  it("registers confirmation as SENSITIVE with requiresApproval", () => {
    const def = getRinpoTool("send_appointment_confirmation");
    assert.ok(def);
    assert.equal(def?.category, "SENSITIVE");
    assert.equal(def?.requiresApproval, true);
  });

  it("drafts a confirmation for approval without enqueueing until approve", async () => {
    const { deps } = makeDeps();
    const branch = await deps.repo.createBranch(ORG_ID, { name: "Pilot Branch", workingHours: DEFAULT_WEEKLY_HOURS });
    assert.equal(branch.ok, true);
    if (!branch.ok) return;
    const staff = await deps.repo.createStaff(ORG_ID, {
      displayName: "Pilot Stylist",
      branchId: branch.data.id,
      workingHours: DEFAULT_WEEKLY_HOURS,
    });
    const service = await deps.repo.createService(ORG_ID, { name: "Cut", durationMin: 30, price: 400 });
    const customer = await deps.repo.upsertCustomerByPhone(ORG_ID, { phone: "+919876543210", preferredChannel: "whatsapp" });
    assert.equal(staff.ok && service.ok && customer.ok, true);
    if (!staff.ok || !service.ok || !customer.ok) return;

    const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const appt = await deps.repo.createAppointment(ORG_ID, {
      branchId: branch.data.id,
      customerId: customer.data.id,
      staffId: staff.data.id,
      startsAt,
      endsAt,
      serviceIds: [service.data.id],
    });
    assert.equal(appt.ok, true);
    if (!appt.ok) return;

    const draft = await executeSalonRinpoTool(deps, staffCtx(), {
      tool: "send_appointment_confirmation",
      args: { appointmentId: appt.data.id },
    });
    assert.equal(draft.ok, true);
    assert.match(draft.message, /Draft ready|approval/i);
    const data = draft.data as { actionId?: string; status?: string; draftPreview?: { recipientPhoneMasked?: string } };
    assert.equal(data.status, "pending_approval");
    assert.ok(data.actionId);
    assert.match(data.draftPreview?.recipientPhoneMasked ?? "", /••••3210/);

    const snap = getRinpoObservationSnapshot(ORG_ID);
    assert.equal(snap.pendingApprovals, 1);
    assert.equal(snap.approvedCompletions, 0);

    const approved = await resolveSalonRinpoAction(deps, staffCtx(), data.actionId!, "approve");
    assert.equal(approved.ok, true);
    assert.match(approved.message, /queued|Not queued/i);

    const after = getRinpoObservationSnapshot(ORG_ID);
    assert.ok(after.approvedCompletions >= 1);
  });

  it("rejects cross-tenant confirmation draft", async () => {
    const { deps } = makeDeps();
    const otherOrg = "org_other";
    const branch = await deps.repo.createBranch(otherOrg, { name: "Other", workingHours: DEFAULT_WEEKLY_HOURS });
    assert.equal(branch.ok, true);
    if (!branch.ok) return;
    const staff = await deps.repo.createStaff(otherOrg, {
      displayName: "Other",
      branchId: branch.data.id,
      workingHours: DEFAULT_WEEKLY_HOURS,
    });
    const service = await deps.repo.createService(otherOrg, { name: "Cut", durationMin: 30, price: 400 });
    const customer = await deps.repo.upsertCustomerByPhone(otherOrg, { phone: "+911111111111" });
    if (!staff.ok || !service.ok || !customer.ok) return;
    const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const appt = await deps.repo.createAppointment(otherOrg, {
      branchId: branch.data.id,
      customerId: customer.data.id,
      staffId: staff.data.id,
      startsAt,
      endsAt,
      serviceIds: [service.data.id],
    });
    if (!appt.ok) return;

    const draft = await executeSalonRinpoTool(deps, staffCtx(), {
      tool: "send_appointment_confirmation",
      args: { appointmentId: appt.data.id },
    });
    assert.equal(draft.ok, false);
    assert.match(draft.message, /outside the active organisation/i);
  });
});
