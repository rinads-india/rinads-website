import type { CommunicationChannel } from "./types";

export type ConsentStatus = "unknown" | "opted_in" | "opted_out";

export type ConsentEvidence = {
  organizationId: string;
  subjectId?: string;
  channel: CommunicationChannel;
  status: ConsentStatus;
  source?: string;
  capturedAt?: string;
  optedOutAt?: string;
  noticeVersion?: string;
};

export type MessagePolicyInput = {
  channel: CommunicationChannel;
  direction: "outbound";
  businessInitiated: boolean;
  templateKey?: string;
  consent?: ConsentEvidence;
  customerServiceWindowOpen?: boolean;
};

export type MessagePolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Conservative send policy for automated outbound messaging.
 *
 * This helper is deliberately stricter than a provider's transport API. It is
 * not legal advice and does not replace channel/provider policy enforcement.
 * Provider adapters may apply additional restrictions.
 */
export function decideOutboundMessagePolicy(input: MessagePolicyInput): MessagePolicyDecision {
  if (input.consent?.status === "opted_out" || input.consent?.optedOutAt) {
    return { allowed: false, reason: "Recipient has opted out of this communication channel." };
  }

  if (input.channel === "whatsapp") {
    if (input.businessInitiated) {
      if (input.consent?.status !== "opted_in") {
        return { allowed: false, reason: "Business-initiated WhatsApp requires recorded opt-in evidence." };
      }
      if (!input.templateKey) {
        return { allowed: false, reason: "Business-initiated WhatsApp requires an approved template key." };
      }
    } else if (!input.customerServiceWindowOpen && !input.templateKey) {
      return {
        allowed: false,
        reason: "WhatsApp message is outside the customer-service window and has no approved template key.",
      };
    }
  }

  return { allowed: true };
}
