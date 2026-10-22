import type { CanonicalCallEvent, CommunicationSubjectRef } from "./types";

export type RinpoCommunicationEventType =
  | "call.completed"
  | "call.missed"
  | "call.recording.ready"
  | "call.transcript.ready"
  | "call.analyzed"
  | "call.high_intent"
  | "call.followup_required"
  | "call.objection_detected"
  | "call.payment_intent"
  | "call.customer_at_risk"
  | "call.proposal_requested"
  | "call.ai_handoff"
  | "message.received"
  | "message.followup_required";

export type RinpoCommunicationIntelligence = {
  intent: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed" | "unknown";
  leadScore?: number;
  urgency: "low" | "medium" | "high" | "critical";
  confidence?: number;
  summary?: string;
  objections: string[];
  commitments: string[];
  decisions: string[];
  questions: string[];
  recommendedActions: Array<{
    type: string;
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    dueAt?: string;
    requiresApproval?: boolean;
  }>;
  structuredOutput: Record<string, unknown>;
};

export type RinpoCommunicationEvent<T = unknown> = {
  eventId: string;
  eventType: RinpoCommunicationEventType;
  occurredAt: string;
  subject: CommunicationSubjectRef;
  call?: Pick<
    CanonicalCallEvent,
    "callSessionId" | "provider" | "providerCallId" | "direction" | "phoneE164"
  >;
  payload: T;
};

export function communicationEventIdempotencyKey(event: {
  provider?: string;
  providerEventId?: string;
  eventId: string;
}): string {
  return event.provider && event.providerEventId
    ? `communication:${event.provider}:${event.providerEventId}`
    : `communication:event:${event.eventId}`;
}
