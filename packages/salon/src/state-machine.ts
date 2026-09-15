import type { AppointmentStatus } from "./types";

/**
 * Appointment lifecycle: pending -> confirmed -> checked_in -> in_service ->
 * completed, with cancellation/no-show as terminal exits available from most
 * non-terminal states. Terminal states (completed, cancelled, no_show) never
 * transition — history is preserved, never mutated after the fact.
 */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_service", "cancelled"],
  in_service: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function nextAppointmentStatuses(from: AppointmentStatus): AppointmentStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransitionAppointmentStatus(from: AppointmentStatus, to: AppointmentStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalAppointmentStatus(status: AppointmentStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/**
 * Reschedule (changing starts_at/ends_at) is only allowed while an
 * appointment hasn't started yet — once the customer has checked in the
 * clock has already started, so a time change no longer makes sense (use
 * cancel + rebook instead).
 */
const RESCHEDULABLE_STATUSES: ReadonlySet<AppointmentStatus> = new Set(["pending", "confirmed"]);

export function canRescheduleAppointment(status: AppointmentStatus): boolean {
  return RESCHEDULABLE_STATUSES.has(status);
}
