import type {
  CanonicalCallEvent,
  CanonicalLeadRef,
  CommunicationAgentRef,
  CommunicationProviderId,
  CommunicationWebhookEvent,
  ProviderCapability,
  ProviderCapabilityMap,
  ProviderHealth,
  ProviderLeadMapping,
} from "./types";

export type PlaceOutboundCallInput = {
  organizationId: string;
  fromNumber: string;
  toNumber: string;
  customerId?: string;
  leadId?: string;
  employeeId?: string;
  purpose?: string;
  dynamicVariables?: Record<string, string>;
};

export type PlaceOutboundCallResult = {
  providerCallId: string;
  status: "initiated" | "queued";
  provider: CommunicationProviderId;
};

export interface TelephonyProvider {
  readonly id: CommunicationProviderId;
  readonly verificationStatus: ProviderHealth["verificationStatus"];

  getCapabilities(): ProviderCapabilityMap;
  healthCheck(): Promise<ProviderHealth>;
  placeOutboundCall(input: PlaceOutboundCallInput): Promise<PlaceOutboundCallResult>;
  createLead(lead: CanonicalLeadRef): Promise<ProviderLeadMapping>;
  updateLead(mapping: ProviderLeadMapping, lead: CanonicalLeadRef): Promise<void>;
  assignLead(mapping: ProviderLeadMapping, agent: CommunicationAgentRef): Promise<void>;
  getCall(providerCallId: string): Promise<CanonicalCallEvent | null>;
  getCallHistory(input: {
    organizationId: string;
    phoneE164?: string;
    providerLeadId?: string;
  }): Promise<CanonicalCallEvent[]>;
  normalizeWebhook(payload: unknown): CommunicationWebhookEvent;
}

export class ProviderCapabilityUnavailableError extends Error {
  readonly code = "provider_capability_unavailable";

  constructor(
    public readonly provider: CommunicationProviderId,
    public readonly capability: ProviderCapability,
    detail?: string,
  ) {
    super(detail ?? `${provider} capability ${capability} is not verified.`);
    this.name = "ProviderCapabilityUnavailableError";
  }
}

export function requireVerifiedCapability(
  provider: CommunicationProviderId,
  verificationStatus: ProviderHealth["verificationStatus"],
  capabilities: ProviderCapabilityMap,
  capability: ProviderCapability,
): void {
  const state = capabilities[capability] ?? "unsupported";
  if (verificationStatus !== "production_verified" || state !== "verified") {
    throw new ProviderCapabilityUnavailableError(
      provider,
      capability,
      `${provider} ${capability} is ${state}; provider status is ${verificationStatus}.`,
    );
  }
}
