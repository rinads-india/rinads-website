import {
  ProviderCapabilityUnavailableError,
  type PlaceOutboundCallInput,
  type PlaceOutboundCallResult,
  type TelephonyProvider,
} from "./providers";
import type {
  CanonicalCallEvent,
  CanonicalLeadRef,
  CommunicationAgentRef,
  CommunicationWebhookEvent,
  ProviderCapabilityMap,
  ProviderHealth,
  ProviderLeadMapping,
} from "./types";

export type CalliyoProviderConfig = {
  enabled: boolean;
  /** Opaque server-side credential binding identifier. Never an API secret. */
  credentialBindingId?: string;
};

/**
 * Conservative manifest migrated from the Communication OS prototype.
 * Advertised vendor functionality is not equivalent to verified API access.
 */
export const CALLIYO_CAPABILITIES: ProviderCapabilityMap = Object.freeze({
  "webhook.events": "unverified",
  "voice.inbound": "unverified",
  "voice.outbound": "unverified",
  "voice.history": "unverified",
  "voice.recording": "unverified",
  "voice.transcript": "unverified",
});

/**
 * Fail-closed Calliyo adapter contract.
 *
 * This intentionally performs no network calls. It becomes operational only
 * after the account-specific API contract, credential scope, webhook signing
 * scheme and sandbox contract tests are verified in the canonical repo.
 */
export class CalliyoProvider implements TelephonyProvider {
  readonly id = "calliyo" as const;
  readonly verificationStatus = "contract_pending" as const;

  constructor(private readonly config: CalliyoProviderConfig) {}

  getCapabilities(): ProviderCapabilityMap {
    return CALLIYO_CAPABILITIES;
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      ok: false,
      provider: this.id,
      verificationStatus: this.config.enabled ? "contract_pending" : "not_configured",
      checkedAt: new Date().toISOString(),
      detail: this.config.enabled
        ? "PENDING CALLIYO API CONFIRMATION"
        : "Calliyo provider is disabled",
    };
  }

  async placeOutboundCall(_input: PlaceOutboundCallInput): Promise<PlaceOutboundCallResult> {
    throw new ProviderCapabilityUnavailableError(this.id, "voice.outbound");
  }

  async createLead(_lead: CanonicalLeadRef): Promise<ProviderLeadMapping> {
    throw new ProviderCapabilityUnavailableError(this.id, "webhook.events", "Calliyo lead API is not verified.");
  }

  async updateLead(_mapping: ProviderLeadMapping, _lead: CanonicalLeadRef): Promise<void> {
    throw new ProviderCapabilityUnavailableError(this.id, "webhook.events", "Calliyo lead API is not verified.");
  }

  async assignLead(_mapping: ProviderLeadMapping, _agent: CommunicationAgentRef): Promise<void> {
    throw new ProviderCapabilityUnavailableError(this.id, "webhook.events", "Calliyo lead assignment API is not verified.");
  }

  async getCall(_providerCallId: string): Promise<CanonicalCallEvent | null> {
    throw new ProviderCapabilityUnavailableError(this.id, "voice.history");
  }

  async getCallHistory(_input: {
    organizationId: string;
    phoneE164?: string;
    providerLeadId?: string;
  }): Promise<CanonicalCallEvent[]> {
    throw new ProviderCapabilityUnavailableError(this.id, "voice.history");
  }

  normalizeWebhook(_payload: unknown): CommunicationWebhookEvent {
    throw new ProviderCapabilityUnavailableError(
      this.id,
      "webhook.events",
      "Calliyo webhook normalization is blocked until signing and payload contracts are verified.",
    );
  }
}
