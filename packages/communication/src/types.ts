export type CommunicationChannel = "voice" | "whatsapp" | "sms" | "email" | "in_app";

export type CommunicationDirection = "inbound" | "outbound";

export type CommunicationProviderId =
  | "calliyo"
  | "exotel"
  | "native-sim"
  | "twilio"
  | "meta-whatsapp"
  | "resend"
  | (string & {});

export type ProviderVerificationStatus =
  | "not_configured"
  | "contract_pending"
  | "sandbox_verified"
  | "production_verified";

export type CommunicationSubjectRef = {
  organizationId: string;
  customerId?: string;
  leadId?: string;
  userId?: string;
  employeeId?: string;
};

export type ProviderHealth = {
  ok: boolean;
  provider: CommunicationProviderId;
  verificationStatus: ProviderVerificationStatus;
  checkedAt: string;
  detail?: string;
};

export type ProviderCapability =
  | "voice.inbound"
  | "voice.outbound"
  | "voice.history"
  | "voice.recording"
  | "voice.transcript"
  | "message.inbound"
  | "message.outbound"
  | "message.templates"
  | "webhook.events";

export type ProviderCapabilityState = "unsupported" | "unverified" | "verified";

export type ProviderCapabilityMap = Partial<Record<ProviderCapability, ProviderCapabilityState>>;

export type CanonicalLeadRef = CommunicationSubjectRef & {
  leadId: string;
  name: string;
  phoneE164: string;
  company?: string;
  source?: string;
  assignedEmployeeId?: string;
};

export type ProviderLeadMapping = {
  organizationId: string;
  provider: CommunicationProviderId;
  providerLeadId: string;
  rinadsLeadId: string;
};

export type CommunicationAgentRef = {
  organizationId: string;
  employeeId: string;
  displayName: string;
  providerAgentId?: string;
  phoneE164?: string;
};

export type CallStatus =
  | "queued"
  | "initiated"
  | "ringing"
  | "answered"
  | "completed"
  | "missed"
  | "failed"
  | "unknown";

export type CanonicalCallEvent = CommunicationSubjectRef & {
  eventId: string;
  provider: CommunicationProviderId;
  providerEventId: string;
  providerCallId?: string;
  callSessionId: string;
  phoneE164: string;
  direction: CommunicationDirection;
  status: CallStatus;
  startedAt?: string;
  answeredAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  recordingUrl?: string;
  transcript?: string;
  rawPayload: unknown;
};

export type NormalizedMessageEvent = CommunicationSubjectRef & {
  eventId: string;
  provider: CommunicationProviderId;
  providerEventId: string;
  channel: Exclude<CommunicationChannel, "voice">;
  direction: CommunicationDirection;
  recipient?: string;
  sender?: string;
  providerMessageId?: string;
  templateKey?: string;
  body?: string;
  occurredAt: string;
  rawPayload: unknown;
};

export type CommunicationWebhookEvent =
  | { kind: "voice"; event: CanonicalCallEvent }
  | { kind: "message"; event: NormalizedMessageEvent };
