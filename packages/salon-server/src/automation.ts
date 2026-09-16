import {
  DEFAULT_AUTOMATION_DELAY_MINUTES,
  automationIdempotencyKey,
  decideAutomation,
  fail,
  isLowRating,
  ok,
  type Result,
  type SalonAppointment,
  type SalonAutomationKind,
  type SalonAutomationRunStatus,
  type SalonAutomationRule,
  type SalonCustomer,
} from "@rinads/salon";
import type { SalonRow, SalonSupabaseClient } from "./client";
import { SalonNotificationService } from "./notifications";
import { SalonRepository } from "./repository";

export type SalonAutomationRun = {
  id: string;
  organizationId: string;
  kind: SalonAutomationKind;
  appointmentId: string;
  customerId: string;
  idempotencyKey: string;
  dueAt: string;
  status: SalonAutomationRunStatus;
  notificationOutboxId?: string;
  skipReason?: string;
};

export type ReviewWorkflowSummary = {
  requested: number;
  submitted: number;
  lowRating: number;
  pending: number;
};

export type RecoveryWorkflowSummary = {
  queued: number;
  converted: number;
  skipped: number;
};

export type SalonAutomationOptions = {
  /** Public origin used to turn opaque feedback paths into customer-facing links. */
  publicBaseUrl?: string;
};

function mapRun(row: SalonRow): SalonAutomationRun {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    kind: row.kind as SalonAutomationKind,
    appointmentId: String(row.appointment_id),
    customerId: String(row.customer_id),
    idempotencyKey: String(row.idempotency_key),
    dueAt: String(row.due_at),
    status: row.status as SalonAutomationRunStatus,
    notificationOutboxId: row.notification_outbox_id ? String(row.notification_outbox_id) : undefined,
    skipReason: row.skip_reason ? String(row.skip_reason) : undefined,
  };
}

export class SalonAutomationRepository {
  constructor(private readonly client: SalonSupabaseClient) {}

  async listRules(organizationId: string): Promise<Result<SalonAutomationRule[]>> {
    const { data, error } = await this.client.from("salon_automation_rules").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map((row) => ({
      kind: row.kind as SalonAutomationKind,
      enabled: Boolean(row.enabled),
      delayMinutes: Number(row.delay_minutes),
    })));
  }

  async ensureRun(
    organizationId: string,
    kind: SalonAutomationKind,
    appointmentId: string,
    customerId: string,
    dueAt: string
  ): Promise<Result<SalonAutomationRun>> {
    const idempotencyKey = automationIdempotencyKey(kind, appointmentId);
    const { error } = await this.client.from("salon_automation_runs").upsert(
      {
        organization_id: organizationId,
        kind,
        appointment_id: appointmentId,
        customer_id: customerId,
        idempotency_key: idempotencyKey,
        due_at: dueAt,
        status: "pending",
      },
      { onConflict: "organization_id,idempotency_key", ignoreDuplicates: true }
    );
    if (error) return fail("db_error", error.message);
    const result = await this.client.from("salon_automation_runs").select("*")
      .eq("organization_id", organizationId).eq("idempotency_key", idempotencyKey).single();
    if (result.error || !result.data) return fail("db_error", result.error?.message ?? "Automation run not found.");
    return ok(mapRun(result.data));
  }

  async updateRun(organizationId: string, id: string, patch: SalonRow): Promise<Result<true>> {
    const { error } = await this.client.from("salon_automation_runs").update(patch)
      .eq("organization_id", organizationId).eq("id", id);
    return error ? fail("db_error", error.message) : ok(true);
  }

  async listDueRuns(organizationId: string, now: Date, limit: number): Promise<Result<SalonAutomationRun[]>> {
    const { data, error } = await this.client.from("salon_automation_runs").select("*")
      .eq("organization_id", organizationId).eq("status", "pending")
      .lte("due_at", now.toISOString()).order("due_at", { ascending: true }).limit(limit);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapRun));
  }

  async ensureReviewRequest(run: SalonAutomationRun): Promise<Result<{ id: string; token: string }>> {
    const { error } = await this.client.from("salon_review_requests").upsert(
      {
        organization_id: run.organizationId,
        automation_run_id: run.id,
        appointment_id: run.appointmentId,
        customer_id: run.customerId,
        public_token: crypto.randomUUID(),
        status: "queued",
      },
      { onConflict: "organization_id,appointment_id", ignoreDuplicates: true }
    );
    if (error) return fail("db_error", error.message);
    const result = await this.client.from("salon_review_requests").select("*")
      .eq("organization_id", run.organizationId).eq("appointment_id", run.appointmentId).single();
    if (result.error || !result.data) return fail("db_error", result.error?.message ?? "Review request not found.");
    return ok({ id: String(result.data.id), token: String(result.data.public_token) });
  }

  async linkReviewRequest(organizationId: string, id: string, outboxId: string): Promise<Result<true>> {
    const { error } = await this.client.from("salon_review_requests")
      .update({ notification_outbox_id: outboxId }).eq("organization_id", organizationId).eq("id", id);
    return error ? fail("db_error", error.message) : ok(true);
  }

  async getReviewSummary(organizationId: string, customerId?: string): Promise<Result<ReviewWorkflowSummary>> {
    let requestQuery = this.client.from("salon_review_requests").select("*").eq("organization_id", organizationId);
    let feedbackQuery = this.client.from("salon_feedback").select("*").eq("organization_id", organizationId);
    if (customerId) {
      requestQuery = requestQuery.eq("customer_id", customerId);
      feedbackQuery = feedbackQuery.eq("customer_id", customerId);
    }
    const [requests, feedback] = await Promise.all([requestQuery, feedbackQuery]);
    if (requests.error || feedback.error) return fail("db_error", requests.error?.message ?? feedback.error?.message ?? "Summary failed.");
    const requestRows = requests.data ?? [];
    const feedbackRows = feedback.data ?? [];
    return ok({
      requested: requestRows.length,
      submitted: requestRows.filter((row) => row.status === "submitted").length,
      lowRating: feedbackRows.filter((row) => Number(row.rating) <= 3).length,
      pending: requestRows.filter((row) => ["queued", "sent", "opened"].includes(String(row.status))).length,
    });
  }

  async getRecoverySummary(organizationId: string, customerId?: string): Promise<Result<RecoveryWorkflowSummary>> {
    let query = this.client.from("salon_automation_runs").select("*").eq("organization_id", organizationId)
      .in("kind", ["no_show_recovery", "unconfirmed_booking_recovery"]);
    if (customerId) query = query.eq("customer_id", customerId);
    const { data, error } = await query;
    if (error) return fail("db_error", error.message);
    const rows = data ?? [];
    return ok({
      queued: rows.filter((row) => row.status === "queued").length,
      converted: rows.filter((row) => row.status === "converted").length,
      skipped: rows.filter((row) => row.status === "skipped").length,
    });
  }
}

export class SalonAutomationService {
  constructor(
    private readonly client: SalonSupabaseClient,
    private readonly repo = new SalonRepository(client),
    private readonly notifications = new SalonNotificationService(client),
    readonly automation = new SalonAutomationRepository(client),
    private readonly options: SalonAutomationOptions = {}
  ) {}

  async scheduleReviewRequest(
    organizationId: string,
    appointment: SalonAppointment,
    dueAt = new Date().toISOString()
  ): Promise<Result<SalonAutomationRun>> {
    if (appointment.organizationId !== organizationId || appointment.status !== "completed") {
      return fail("invalid_input", "A completed appointment in this organization is required.");
    }
    return this.automation.ensureRun(organizationId, "review_request", appointment.id, appointment.customerId, dueAt);
  }

  async processDue(
    organizationId: string,
    options: { now?: Date; limit?: number } = {}
  ): Promise<Result<{ considered: number; queued: number; skipped: number; failed: number }>> {
    const now = options.now ?? new Date();
    const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
    const [appointmentsResult, rulesResult, pendingRunsResult] = await Promise.all([
      this.repo.listAppointments(organizationId),
      this.automation.listRules(organizationId),
      this.automation.listDueRuns(organizationId, now, limit),
    ]);
    if (!appointmentsResult.ok) return appointmentsResult;
    if (!rulesResult.ok) return rulesResult;
    if (!pendingRunsResult.ok) return pendingRunsResult;
    const rules = new Map(rulesResult.data.map((rule) => [rule.kind, rule]));

    const candidates = new Map<string, {
      appointment: SalonAppointment;
      customer: SalonCustomer;
      kind: SalonAutomationKind;
      dueAt: string;
      run?: SalonAutomationRun;
    }>();
    const appointments = new Map(appointmentsResult.data.map((appointment) => [appointment.id, appointment]));
    for (const run of pendingRunsResult.data) {
      const appointment = appointments.get(run.appointmentId);
      const expectedStatus = run.kind === "review_request" ? "completed"
        : run.kind === "no_show_recovery" ? "no_show" : "pending";
      if (
        !appointment ||
        appointment.status !== expectedStatus ||
        rules.get(run.kind)?.enabled === false ||
        (run.kind === "unconfirmed_booking_recovery" && now.getTime() >= new Date(appointment.startsAt).getTime())
      ) {
        await this.automation.updateRun(organizationId, run.id, { status: "skipped", skip_reason: "Automation stop condition reached." });
        continue;
      }
      const customerResult = await this.repo.getCustomer(run.customerId);
      if (!customerResult.ok || customerResult.data.organizationId !== organizationId) continue;
      candidates.set(run.idempotencyKey, {
        appointment,
        customer: customerResult.data,
        kind: run.kind,
        dueAt: run.dueAt,
        run,
      });
    }

    for (const appointment of appointmentsResult.data) {
      const kind: SalonAutomationKind | undefined =
        appointment.status === "completed" ? "review_request"
          : appointment.status === "no_show" ? "no_show_recovery"
            : appointment.status === "pending" ? "unconfirmed_booking_recovery" : undefined;
      if (!kind) continue;
      const customerResult = await this.repo.getCustomer(appointment.customerId);
      if (!customerResult.ok || customerResult.data.organizationId !== organizationId) continue;
      const rule = rules.get(kind);
      const decision = decideAutomation({
        kind,
        appointment,
        now,
        enabled: rule?.enabled ?? true,
        delayMinutes: rule?.delayMinutes ?? DEFAULT_AUTOMATION_DELAY_MINUTES[kind],
      });
      if (decision.due) {
        const key = automationIdempotencyKey(kind, appointment.id);
        if (!candidates.has(key)) {
          candidates.set(key, { appointment, customer: customerResult.data, kind, dueAt: decision.dueAt });
        }
      }
    }
    const boundedCandidates = [...candidates.values()].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, limit);

    const totals = { considered: 0, queued: 0, skipped: 0, failed: 0 };
    for (const candidate of boundedCandidates) {
      totals.considered += 1;
      const runResult = candidate.run
        ? ok(candidate.run)
        : await this.automation.ensureRun(
            organizationId, candidate.kind, candidate.appointment.id, candidate.customer.id, candidate.dueAt
          );
      if (!runResult.ok) { totals.failed += 1; continue; }
      const run = runResult.data;
      if (run.status !== "pending") continue;

      let reviewRequest: { id: string; token: string } | undefined;
      if (candidate.kind === "review_request") {
        const requestResult = await this.automation.ensureReviewRequest(run);
        if (!requestResult.ok) {
          await this.automation.updateRun(organizationId, run.id, { status: "failed", last_error: requestResult.error.message });
          totals.failed += 1;
          continue;
        }
        reviewRequest = requestResult.data;
      }

      const event = candidate.kind === "review_request" ? "review.request_due"
        : candidate.kind === "no_show_recovery" ? "no_show.recovery_due"
          : "unconfirmed_booking.recovery_due";
      const feedbackUrl = reviewRequest
        ? `${this.options.publicBaseUrl?.replace(/\/$/, "") ?? ""}/feedback/${reviewRequest.token}`
        : undefined;
      const messageBody = candidate.kind === "review_request"
        ? `Thank you for visiting. Share your feedback: ${feedbackUrl}`
        : candidate.kind === "no_show_recovery"
          ? "We missed you at your appointment. Reply to this message to arrange a new time."
          : "Your upcoming appointment is awaiting confirmation. Reply to confirm or contact the salon.";
      const enqueue = await this.notifications.enqueue({
        organizationId,
        event,
        recipientPhone: candidate.customer.phone,
        preferredChannel: candidate.customer.preferredChannel,
        optedOutAt: candidate.customer.optedOutAt,
        idempotencyKey: run.idempotencyKey,
        payload: {
          organizationId,
          appointmentId: candidate.appointment.id,
          customerId: candidate.customer.id,
          feedbackPath: reviewRequest ? `/feedback/${reviewRequest.token}` : undefined,
          feedbackUrl,
          messageBody,
        },
      });
      if (!enqueue.ok) {
        await this.automation.updateRun(organizationId, run.id, { status: "failed", last_error: enqueue.error.message });
        totals.failed += 1;
      } else if (enqueue.data.skipped) {
        await this.automation.updateRun(organizationId, run.id, { status: "skipped", skip_reason: enqueue.data.reason });
        totals.skipped += 1;
      } else {
        await this.automation.updateRun(organizationId, run.id, {
          status: "queued",
          notification_outbox_id: enqueue.data.outboxId,
          queued_at: now.toISOString(),
        });
        if (reviewRequest) {
          await this.automation.linkReviewRequest(organizationId, reviewRequest.id, enqueue.data.outboxId);
        }
        totals.queued += 1;
      }
    }
    return ok(totals);
  }

  async submitFeedback(token: string, rating: number, comment?: string): Promise<Result<{ accepted: boolean }>> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("invalid_input", "Rating must be from 1 to 5.");
    const { data, error } = await this.client.rpc("submit_salon_feedback", {
      p_token: token,
      p_rating: rating,
      p_comment: comment ?? null,
    });
    if (error) return fail("db_error", error.message);
    const row = (data as Array<{ accepted: boolean }> | null)?.[0];
    return ok({ accepted: Boolean(row?.accepted) });
  }

  isManagerFollowupRequired(rating: number): boolean {
    return isLowRating(rating);
  }
}

