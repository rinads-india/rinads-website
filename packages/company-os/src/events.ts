/**
 * Company OS event catalog — emit via @rinads/runtime business_events.
 * Names are stable contracts for Intelligence subscriptions.
 */
export const COMPANY_OS_EVENTS = [
  "lead.created",
  "lead.qualified",
  "opportunity.stage_changed",
  "proposal.sent",
  "proposal.accepted",
  "contract.signed",
  "client.created",
  "client.health.changed",
  "project.started",
  "project.health.changed",
  "task.created",
  "task.completed",
  "milestone.delayed",
  "deliverable.submitted",
  "deliverable.approved",
  "invoice.issued",
  "payment.received",
  "invoice.overdue",
  "approval.requested",
  "approval.completed",
  "approval.rejected",
  "daily_closing.submitted",
  "attention.created",
  "attention.resolved",
  "ai.action.executed",
  "ai.action.failed",
  "assignment.overridden",
] as const;

export type CompanyOsEventName = (typeof COMPANY_OS_EVENTS)[number];

export function isCompanyOsEvent(name: string): name is CompanyOsEventName {
  return (COMPANY_OS_EVENTS as readonly string[]).includes(name);
}
