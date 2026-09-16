import type { PreferredChannel, SalonAppointment } from "./types";

export type SalonAutomationKind = "review_request" | "no_show_recovery" | "unconfirmed_booking_recovery";
export type SalonAutomationRunStatus = "pending" | "queued" | "skipped" | "failed" | "converted";
export type ReviewRequestStatus = "queued" | "sent" | "opened" | "submitted" | "expired" | "skipped";
export type SalonFeedbackStatus = "received" | "escalated" | "resolved";

export type SalonAutomationRule = {
  kind: SalonAutomationKind;
  enabled: boolean;
  delayMinutes: number;
};

export const DEFAULT_AUTOMATION_DELAY_MINUTES: Record<SalonAutomationKind, number> = {
  review_request: 120,
  no_show_recovery: 120,
  unconfirmed_booking_recovery: 24 * 60,
};

export type AutomationDecision =
  | { due: true; dueAt: string }
  | { due: false; reason: "disabled" | "not_due" | "stopped" | "opted_out" | "no_channel" };

export function automationIdempotencyKey(kind: SalonAutomationKind, appointmentId: string): string {
  return `salon-automation:${kind}:appointment:${appointmentId}`;
}

export function automationDueAt(
  kind: SalonAutomationKind,
  appointment: Pick<SalonAppointment, "startsAt" | "endsAt">,
  delayMinutes = DEFAULT_AUTOMATION_DELAY_MINUTES[kind]
): string {
  const anchor =
    kind === "unconfirmed_booking_recovery"
      ? new Date(appointment.startsAt).getTime() - delayMinutes * 60_000
      : new Date(appointment.endsAt).getTime() + delayMinutes * 60_000;
  return new Date(anchor).toISOString();
}

export function decideAutomation(input: {
  kind: SalonAutomationKind;
  appointment: Pick<SalonAppointment, "status" | "startsAt" | "endsAt">;
  now: Date;
  enabled?: boolean;
  delayMinutes?: number;
  optedOutAt?: string;
  preferredChannel?: PreferredChannel;
}): AutomationDecision {
  if (input.enabled === false) return { due: false, reason: "disabled" };
  if (input.optedOutAt) return { due: false, reason: "opted_out" };
  if (input.preferredChannel === "none") return { due: false, reason: "no_channel" };

  const requiredStatus =
    input.kind === "review_request" ? "completed" : input.kind === "no_show_recovery" ? "no_show" : "pending";
  if (input.appointment.status !== requiredStatus) return { due: false, reason: "stopped" };
  if (
    input.kind === "unconfirmed_booking_recovery" &&
    input.now.getTime() >= new Date(input.appointment.startsAt).getTime()
  ) {
    return { due: false, reason: "stopped" };
  }

  const dueAt = automationDueAt(input.kind, input.appointment, input.delayMinutes);
  return input.now.getTime() >= new Date(dueAt).getTime()
    ? { due: true, dueAt }
    : { due: false, reason: "not_due" };
}

export function isLowRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 3;
}

