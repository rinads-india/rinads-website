/**
 * Async salon tool executor (R GLOW Phase D). Registered tool *metadata*
 * (category, permission, requiresApproval) lives in the shared
 * `registry.ts` — this module is only the execution engine for tools
 * tagged `vertical: "salon"`, kept separate from the synchronous
 * `executeRinpoTool()` in `tools.ts` because every salon call is a real
 * async Supabase round-trip (no in-memory-first store to execute against
 * synchronously, unlike the commerce/ops demo services).
 *
 * Authorization: real permission-array checks against the caller's
 * resolved `TenancyContext.permissions` (not a role-name shorthand) — the
 * one exception is founder/super_admin, which mirrors `tools.ts`'s
 * existing `isOwnerToolCaller` pattern of never being blocked by a missing
 * per-org permission row (system-scope roles).
 */
import { isPrivilegedRoleKey } from "@rinads/permissions";
import type { Result } from "@rinads/salon";
import {
  getBusinessSummary,
  getCustomerCommunicationPreferences,
  getEmptySlots,
  getPendingPaymentsSummary,
  getRevenueSummary,
  getServicePerformance,
  getStaffUtilization,
  getTodayAppointments,
  RinpoActionsRepository,
  SalonNotificationService,
  SalonRepository,
  type RinpoActionRecord,
} from "@rinads/salon-server";
import { getRinpoTool } from "./registry";
import type { RinpoToolInput, RinpoToolResult } from "./types";

export type SalonRinpoContext = {
  organizationId: string;
  userId?: string;
  roleKey?: string;
  /** Real, resolved permission keys for the caller in this org (from `TenancyContext.permissions`). */
  permissions: string[];
};

export type SalonRinpoDeps = {
  repo: SalonRepository;
  actions: RinpoActionsRepository;
  notifications: SalonNotificationService;
};

function hasSalonPermission(ctx: SalonRinpoContext, permission: string | undefined): boolean {
  if (!permission) return true;
  if (isPrivilegedRoleKey(ctx.roleKey ?? "")) return true;
  return ctx.permissions.includes(permission);
}

function arg(input: RinpoToolInput, key: string): string {
  return String(input.args[key] ?? "");
}

function argNum(input: RinpoToolInput, key: string, fallback?: number): number | undefined {
  const raw = input.args[key];
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

async function auditWrite(
  deps: SalonRinpoDeps,
  ctx: SalonRinpoContext,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown>
) {
  try {
    await deps.repo.writeRinpoAuditLog(ctx.organizationId, { actorId: ctx.userId, action, resourceType, resourceId, metadata });
  } catch {
    // Audit logging must never block the primary action; a failure here is
    // surfaced only if a future pass adds monitoring, not to the caller.
  }
}

/** Creates a pending `rinpo_actions` row for a `requiresApproval` tool instead of executing it. */
async function requestApproval(
  deps: SalonRinpoDeps,
  ctx: SalonRinpoContext,
  tool: string,
  input: Record<string, unknown>,
  reason?: string
): Promise<Result<RinpoActionRecord>> {
  return deps.actions.createPending(ctx.organizationId, { userId: ctx.userId, actionType: tool, input, reason });
}

export async function executeSalonRinpoTool(
  deps: SalonRinpoDeps,
  ctx: SalonRinpoContext,
  input: RinpoToolInput
): Promise<RinpoToolResult> {
  const def = getRinpoTool(input.tool);
  if (!def || def.vertical !== "salon") {
    return { tool: input.tool, ok: false, message: "Unknown salon tool." };
  }
  if (!hasSalonPermission(ctx, def.requiredPermission)) {
    return { tool: input.tool, ok: false, message: "Insufficient permissions for this tool." };
  }

  if (def.category === "SENSITIVE" && def.requiresApproval) {
    const pending = await requestApproval(deps, ctx, input.tool, input.args as Record<string, unknown>, arg(input, "reason") || undefined);
    if (!pending.ok) return { tool: input.tool, ok: false, message: pending.error.message };

    // initiate_refund also creates the domain-level pending refund row now
    // (requesting a refund carries no financial risk by itself — only
    // *approving/processing* it moves money, which stays permission-gated
    // at the RLS layer via refund.approve).
    if (input.tool === "initiate_refund") {
      const saleId = arg(input, "saleId");
      const amount = argNum(input, "amount") ?? 0;
      const refundResult = await deps.repo.requestRefund(ctx.organizationId, {
        saleId,
        amount,
        reason: arg(input, "reason") || "Requested via RINPO",
        requestedBy: ctx.userId,
      });
      if (refundResult.ok) {
        await deps.actions.markExecuted(pending.data.id, { refundId: refundResult.data.id, status: "pending_approval" });
      }
    }

    return {
      tool: input.tool,
      ok: true,
      message: "This action requires approval before it runs. An admin can approve it from the RINPO approvals list.",
      data: { actionId: pending.data.id, status: "pending_approval" },
    };
  }

  switch (input.tool) {
    // -----------------------------------------------------------------
    // READ tools
    // -----------------------------------------------------------------
    case "get_salon_business_summary": {
      const summary = await getBusinessSummary(deps.repo, ctx.organizationId, argNum(input, "daysInactive", 45));
      return { tool: input.tool, ok: true, message: "Business summary ready.", data: summary };
    }
    case "get_today_appointments": {
      const result = await getTodayAppointments(deps.repo, ctx.organizationId, input.args.branchId ? arg(input, "branchId") : undefined);
      return { tool: input.tool, ok: true, message: `${result.total} appointment(s) today.`, data: result };
    }
    case "get_staff_utilization": {
      const result = await getStaffUtilization(deps.repo, ctx.organizationId);
      return { tool: input.tool, ok: true, message: "Staff utilization ready.", data: result };
    }
    case "get_empty_slots": {
      const branchId = arg(input, "branchId");
      if (!branchId) return { tool: input.tool, ok: false, message: "branchId is required." };
      const result = await getEmptySlots(deps.repo, ctx.organizationId, branchId);
      return { tool: input.tool, ok: true, message: "Empty slots ready.", data: result };
    }
    case "get_customer_history": {
      const customerId = arg(input, "customerId");
      if (!customerId) return { tool: input.tool, ok: false, message: "customerId is required." };
      const result = await deps.repo.getCustomerProfile(ctx.organizationId, customerId);
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      return { tool: input.tool, ok: true, message: "Customer history ready.", data: result.data };
    }
    case "get_reactivation_candidates": {
      const daysInactive = argNum(input, "daysInactive", 45) ?? 45;
      const result = await deps.repo.getReactivationCandidates(ctx.organizationId, daysInactive);
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      return { tool: input.tool, ok: true, message: `${result.data.length} reactivation candidate(s).`, data: result.data };
    }
    case "get_revenue_summary": {
      const days = argNum(input, "days", 30) ?? 30;
      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
      const summary = await getRevenueSummary(deps.repo, ctx.organizationId, from, to);
      return { tool: input.tool, ok: true, message: `Revenue over the last ${days} days: ${summary.currency} ${summary.totalRevenue}.`, data: summary };
    }
    case "get_service_performance": {
      const result = await getServicePerformance(deps.repo, ctx.organizationId);
      return { tool: input.tool, ok: true, message: "Service performance ready.", data: result };
    }
    case "get_pending_payments": {
      const summary = await getPendingPaymentsSummary(deps.repo, ctx.organizationId);
      return { tool: input.tool, ok: true, message: `${summary.count} sale(s) awaiting payment.`, data: summary };
    }
    case "get_customer_communication_preferences": {
      const customerId = arg(input, "customerId");
      const prefs = await getCustomerCommunicationPreferences(deps.repo, customerId);
      if (!prefs) return { tool: input.tool, ok: false, message: "Customer not found." };
      return { tool: input.tool, ok: true, message: "Communication preferences ready.", data: prefs };
    }

    // -----------------------------------------------------------------
    // WRITE/EXECUTE tools — immediate execution + audit trail
    // -----------------------------------------------------------------
    case "create_appointment": {
      const branchId = arg(input, "branchId");
      const staffId = arg(input, "staffId");
      const customerPhone = arg(input, "customerPhone");
      const serviceIds = String(input.args.serviceIds ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const startsAt = arg(input, "startsAt");
      if (!branchId || !staffId || !customerPhone || !serviceIds.length || !startsAt) {
        return { tool: input.tool, ok: false, message: "branchId, staffId, customerPhone, serviceIds, and startsAt are required." };
      }
      const servicesResult = await deps.repo.listServices(ctx.organizationId);
      if (!servicesResult.ok) return { tool: input.tool, ok: false, message: servicesResult.error.message };
      const selected = servicesResult.data.filter((s) => serviceIds.includes(s.id));
      const totalMin = selected.reduce((sum, s) => sum + s.durationMin + s.bufferMin, 0);
      if (totalMin <= 0) return { tool: input.tool, ok: false, message: "Selected services are invalid." };
      const endsAt = new Date(new Date(startsAt).getTime() + totalMin * 60_000).toISOString();

      const customerResult = await deps.repo.upsertCustomerByPhone(ctx.organizationId, {
        phone: customerPhone,
        name: input.args.customerName ? arg(input, "customerName") : undefined,
      });
      if (!customerResult.ok) return { tool: input.tool, ok: false, message: customerResult.error.message };

      const result = await deps.repo.createAppointment(ctx.organizationId, {
        branchId,
        staffId,
        customerId: customerResult.data.id,
        startsAt,
        endsAt,
        serviceIds,
        notes: input.args.notes ? arg(input, "notes") : undefined,
      });
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.create_appointment", "salon_appointment", result.data.id, { branchId, staffId });
      return { tool: input.tool, ok: true, message: "Appointment booked.", data: result.data };
    }
    case "reschedule_appointment": {
      const appointmentId = arg(input, "appointmentId");
      const newStartsAt = arg(input, "newStartsAt");
      if (!appointmentId || !newStartsAt) return { tool: input.tool, ok: false, message: "appointmentId and newStartsAt are required." };
      const apptResult = await deps.repo.getAppointment(appointmentId);
      if (!apptResult.ok) return { tool: input.tool, ok: false, message: apptResult.error.message };
      const durationMs = new Date(apptResult.data.endsAt).getTime() - new Date(apptResult.data.startsAt).getTime();
      const newEndsAt = new Date(new Date(newStartsAt).getTime() + durationMs).toISOString();
      const result = await deps.repo.rescheduleAppointment(appointmentId, apptResult.data.status, newStartsAt, newEndsAt);
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.reschedule_appointment", "salon_appointment", appointmentId, { newStartsAt });
      return { tool: input.tool, ok: true, message: "Appointment rescheduled." };
    }
    case "cancel_appointment": {
      const appointmentId = arg(input, "appointmentId");
      if (!appointmentId) return { tool: input.tool, ok: false, message: "appointmentId is required." };
      const apptResult = await deps.repo.getAppointment(appointmentId);
      if (!apptResult.ok) return { tool: input.tool, ok: false, message: apptResult.error.message };
      const reason = input.args.reason ? arg(input, "reason") : undefined;
      const result = await deps.repo.updateAppointmentStatus(appointmentId, apptResult.data.status, "cancelled", reason);
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.cancel_appointment", "salon_appointment", appointmentId, { reason });
      return { tool: input.tool, ok: true, message: "Appointment cancelled." };
    }
    case "create_customer_followup": {
      const customerId = arg(input, "customerId");
      const body = arg(input, "body") || "Follow up with this customer.";
      if (!customerId) return { tool: input.tool, ok: false, message: "customerId is required." };
      const result = await deps.repo.createNote(ctx.organizationId, {
        entityType: "staff_task",
        entityId: customerId,
        body,
        assignedTo: input.args.assignedTo ? arg(input, "assignedTo") : undefined,
        dueAt: input.args.dueAt ? arg(input, "dueAt") : undefined,
        createdBy: ctx.userId,
      });
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.create_customer_followup", "salon_note", result.data.id, { customerId });
      return { tool: input.tool, ok: true, message: "Follow-up task created.", data: result.data };
    }
    case "send_appointment_confirmation":
    case "send_appointment_reminder": {
      const appointmentId = arg(input, "appointmentId");
      if (!appointmentId) return { tool: input.tool, ok: false, message: "appointmentId is required." };
      const apptResult = await deps.repo.getAppointment(appointmentId);
      if (!apptResult.ok) return { tool: input.tool, ok: false, message: apptResult.error.message };
      const customerResult = await deps.repo.getCustomer(apptResult.data.customerId);
      if (!customerResult.ok) return { tool: input.tool, ok: false, message: customerResult.error.message };
      const event = input.tool === "send_appointment_confirmation" ? "booking.confirmed" : "appointment.reminder_due";
      const enqueueResult = await deps.notifications.enqueue({
        organizationId: ctx.organizationId,
        event,
        recipientPhone: customerResult.data.phone,
        preferredChannel: customerResult.data.preferredChannel,
        optedOutAt: customerResult.data.optedOutAt,
        payload: { appointmentId, startsAt: apptResult.data.startsAt, bookingNumber: apptResult.data.bookingNumber },
        idempotencyKey: `${event}:${appointmentId}`,
      });
      if (!enqueueResult.ok) return { tool: input.tool, ok: false, message: enqueueResult.error.message };
      await auditWrite(deps, ctx, `rinpo.${input.tool}`, "salon_appointment", appointmentId, {});
      return {
        tool: input.tool,
        ok: true,
        message: enqueueResult.data.skipped ? `Not queued: ${enqueueResult.data.reason}` : "Message queued for delivery.",
        data: enqueueResult.data,
      };
    }
    case "create_reactivation_campaign": {
      const daysInactive = argNum(input, "daysInactive", 45) ?? 45;
      const candidatesResult = await deps.repo.getReactivationCandidates(ctx.organizationId, daysInactive);
      if (!candidatesResult.ok) return { tool: input.tool, ok: false, message: candidatesResult.error.message };
      let queued = 0;
      let skipped = 0;
      for (const candidate of candidatesResult.data) {
        const enqueueResult = await deps.notifications.enqueue({
          organizationId: ctx.organizationId,
          event: "customer.reactivation_due",
          recipientPhone: candidate.customer.phone,
          preferredChannel: candidate.customer.preferredChannel,
          optedOutAt: candidate.customer.optedOutAt,
          payload: { customerId: candidate.customer.id, lastVisitAt: candidate.lastVisitAt },
          idempotencyKey: `customer.reactivation_due:${candidate.customer.id}:${candidate.lastVisitAt}`,
        });
        if (enqueueResult.ok && !enqueueResult.data.skipped) queued++;
        else skipped++;
      }
      await auditWrite(deps, ctx, "rinpo.create_reactivation_campaign", "salon_customer", ctx.organizationId, { queued, skipped });
      return { tool: input.tool, ok: true, message: `Queued ${queued} reactivation message(s), skipped ${skipped}.`, data: { queued, skipped } };
    }
    case "create_staff_task": {
      const body = arg(input, "body");
      if (!body) return { tool: input.tool, ok: false, message: "body is required." };
      const assignedTo = input.args.assignedTo ? arg(input, "assignedTo") : undefined;
      const result = await deps.repo.createNote(ctx.organizationId, {
        entityType: "staff_task",
        entityId: assignedTo ?? ctx.organizationId,
        body,
        assignedTo,
        dueAt: input.args.dueAt ? arg(input, "dueAt") : undefined,
        createdBy: ctx.userId,
      });
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.create_staff_task", "salon_note", result.data.id, {});
      return { tool: input.tool, ok: true, message: "Staff task created.", data: result.data };
    }
    case "create_customer_note": {
      const customerId = arg(input, "customerId");
      const body = arg(input, "body");
      if (!customerId || !body) return { tool: input.tool, ok: false, message: "customerId and body are required." };
      const result = await deps.repo.createNote(ctx.organizationId, {
        entityType: "customer",
        entityId: customerId,
        body,
        createdBy: ctx.userId,
      });
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.create_customer_note", "salon_note", result.data.id, { customerId });
      return { tool: input.tool, ok: true, message: "Note added.", data: result.data };
    }
    case "issue_receipt_or_invoice": {
      const saleId = arg(input, "saleId");
      if (!saleId) return { tool: input.tool, ok: false, message: "saleId is required." };
      const result = await deps.repo.finalizeSale(ctx.organizationId, saleId);
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.issue_receipt_or_invoice", "salon_sale", saleId, { saleNumber: result.data.saleNumber });
      return { tool: input.tool, ok: true, message: `Invoice ${result.data.saleNumber} ready.`, data: result.data };
    }

    // -----------------------------------------------------------------
    // SENSITIVE, no-approval-required: record_payment (see registry.ts note)
    // -----------------------------------------------------------------
    case "record_payment": {
      const saleId = arg(input, "saleId");
      const method = arg(input, "method") as "cash" | "upi" | "card" | "razorpay";
      const amount = argNum(input, "amount") ?? 0;
      const idempotencyKey = arg(input, "idempotencyKey") || `rinpo:record_payment:${saleId}:${amount}:${Date.now()}`;
      if (!saleId || !method || amount <= 0) return { tool: input.tool, ok: false, message: "saleId, method, and a positive amount are required." };
      const result = await deps.repo.recordPayment(ctx.organizationId, saleId, { method, amount, idempotencyKey, recordedBy: ctx.userId });
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      await auditWrite(deps, ctx, "rinpo.record_payment", "salon_payment", result.data.id, { saleId, amount, method });
      return { tool: input.tool, ok: true, message: "Payment recorded.", data: result.data };
    }

    default:
      return { tool: input.tool, ok: false, message: "Unknown salon tool." };
  }
}

/**
 * Resolves a pending RINPO action after an `org.manage` approver decides.
 * For `initiate_refund`, the domain-level `salon_refunds` row is the real
 * approval surface (see plan's "Approval reuse" note); this only advances
 * the `rinpo_actions` audit record to match. For `modify_pricing` /
 * `modify_discount` there is no other pending state — approving here is
 * what actually applies the change.
 */
export async function resolveSalonRinpoAction(
  deps: SalonRinpoDeps,
  ctx: SalonRinpoContext,
  actionId: string,
  decision: "approve" | "reject"
): Promise<RinpoToolResult> {
  const actionResult = await deps.actions.get(actionId);
  if (!actionResult.ok) return { tool: "resolve_rinpo_action", ok: false, message: actionResult.error.message };
  const action = actionResult.data;

  if (decision === "reject") {
    const rejectResult = await deps.actions.reject(actionId, ctx.userId ?? "");
    if (!rejectResult.ok) return { tool: "resolve_rinpo_action", ok: false, message: rejectResult.error.message };
    return { tool: "resolve_rinpo_action", ok: true, message: "Action rejected." };
  }

  const approveResult = await deps.actions.approve(actionId, ctx.userId ?? "");
  if (!approveResult.ok) return { tool: "resolve_rinpo_action", ok: false, message: approveResult.error.message };

  switch (action.actionType) {
    case "modify_pricing": {
      const serviceId = String(action.input.serviceId ?? "");
      const newPrice = Number(action.input.newPrice ?? action.input.price ?? 0);
      const result = await deps.repo.updateServicePrice(serviceId, newPrice);
      if (!result.ok) {
        await deps.actions.markFailed(actionId, result.error.message);
        return { tool: "resolve_rinpo_action", ok: false, message: result.error.message };
      }
      await deps.actions.markExecuted(actionId, { serviceId, newPrice });
      return { tool: "resolve_rinpo_action", ok: true, message: "Price updated." };
    }
    case "modify_discount": {
      const saleLineId = String(action.input.saleLineId ?? "");
      const discountAmount = Number(action.input.discountAmount ?? 0);
      const result = await deps.repo.applySaleLineDiscount(saleLineId, discountAmount);
      if (!result.ok) {
        await deps.actions.markFailed(actionId, result.error.message);
        return { tool: "resolve_rinpo_action", ok: false, message: result.error.message };
      }
      await deps.actions.markExecuted(actionId, { saleLineId, discountAmount });
      return { tool: "resolve_rinpo_action", ok: true, message: "Discount applied." };
    }
    case "initiate_refund": {
      const refundId = String(action.output?.refundId ?? "");
      if (!refundId) {
        await deps.actions.markFailed(actionId, "No linked refund found.");
        return { tool: "resolve_rinpo_action", ok: false, message: "No linked refund found." };
      }
      const result = await deps.repo.approveRefund(refundId, "pending", ctx.userId);
      if (!result.ok) {
        await deps.actions.markFailed(actionId, result.error.message);
        return { tool: "resolve_rinpo_action", ok: false, message: result.error.message };
      }
      await deps.actions.markExecuted(actionId, { refundId, status: "approved" });
      return { tool: "resolve_rinpo_action", ok: true, message: "Refund approved — process it from the POS refunds list." };
    }
    default:
      await deps.actions.markFailed(actionId, `Unknown action type: ${action.actionType}`);
      return { tool: "resolve_rinpo_action", ok: false, message: `Unknown action type: ${action.actionType}` };
  }
}
