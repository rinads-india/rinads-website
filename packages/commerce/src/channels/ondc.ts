export const ONDC_TRANSACTION_ACTIONS = [
  "search",
  "select",
  "init",
  "confirm",
  "status",
  "track",
  "cancel",
  "update",
  "rating",
  "support",
] as const;

export type OndcAction = (typeof ONDC_TRANSACTION_ACTIONS)[number];
export type OndcCallbackAction = `on_${OndcAction}`;
export type OndcProtocolAction = OndcAction | OndcCallbackAction;
export type OndcParticipantRole = "buyer_app" | "seller_app";
export type OndcEnvironment = "staging" | "preprod" | "production";
export type OndcMessageDirection = "inbound" | "outbound";

export type OndcChannelConfig = {
  organizationId: string;
  role: OndcParticipantRole;
  subscriberId: string;
  subscriberUrl: string;
  domain: string;
  protocolVersion: string;
  environment: OndcEnvironment;
};

export type OndcProtocolEnvelope<TMessage = Record<string, unknown>> = {
  /** Kept raw/versioned at the protocol boundary; do not make it Commerce truth. */
  context: Record<string, unknown>;
  message?: TMessage;
  error?: Record<string, unknown>;
};

export type OndcMessageIdentity = {
  subscriberId: string;
  transactionId: string;
  messageId: string;
  action: OndcProtocolAction;
  direction: OndcMessageDirection;
};

export type OndcCanonicalTransactionLink = {
  organizationId: string;
  networkTransactionId: string;
  canonicalOrderId?: string;
};

export type OndcNetworkPort = {
  /** Transport/signing implementation is server-only and version-specific. */
  send(input: {
    config: OndcChannelConfig;
    action: OndcAction;
    envelope: OndcProtocolEnvelope;
  }): Promise<{ accepted: boolean; requestId?: string }>;
  verify(input: {
    config: OndcChannelConfig;
    action: OndcCallbackAction;
    headers: Record<string, string | undefined>;
    rawBody: string;
  }): Promise<{ valid: boolean; keyId?: string; reason?: string }>;
};

export function callbackForOndcAction(action: OndcAction): OndcCallbackAction {
  return `on_${action}`;
}

export function requestForOndcCallback(action: string): OndcAction | null {
  if (!action.startsWith("on_")) return null;
  const request = action.slice(3);
  return (ONDC_TRANSACTION_ACTIONS as readonly string[]).includes(request)
    ? (request as OndcAction)
    : null;
}

export function isKnownOndcProtocolAction(action: string): action is OndcProtocolAction {
  if ((ONDC_TRANSACTION_ACTIONS as readonly string[]).includes(action)) return true;
  return requestForOndcCallback(action) !== null;
}

export function isMatchingOndcCallback(requestAction: OndcAction, callbackAction: string): boolean {
  return callbackAction === callbackForOndcAction(requestAction);
}

export function validateOndcChannelConfig(config: OndcChannelConfig): void {
  if (!config.organizationId.trim()) throw new Error("ONDC organization id is required.");
  if (!config.subscriberId.trim()) throw new Error("ONDC subscriber id is required.");
  if (!config.domain.trim()) throw new Error("ONDC domain is required.");
  if (!config.protocolVersion.trim()) throw new Error("ONDC protocol version is required.");

  let url: URL;
  try {
    url = new URL(config.subscriberUrl);
  } catch {
    throw new Error("ONDC subscriber URL must be a valid URL.");
  }
  if (config.environment === "production" && url.protocol !== "https:") {
    throw new Error("Production ONDC subscriber URL must use HTTPS.");
  }
}

export function ondcMessageIdempotencyKey(identity: OndcMessageIdentity): string {
  const values = [
    identity.subscriberId,
    identity.transactionId,
    identity.messageId,
    identity.action,
    identity.direction,
  ].map((value) => value.trim());

  if (values.some((value) => value.length === 0)) {
    throw new Error("ONDC message identity fields are required for idempotency.");
  }

  return values.join(":");
}

/**
 * Network order state is an integration projection. The canonical RINADS order
 * remains authoritative for local commerce state.
 */
export function canLinkOndcTransactionToOrder(input: OndcCanonicalTransactionLink): boolean {
  return Boolean(
    input.organizationId.trim() &&
      input.networkTransactionId.trim() &&
      (!input.canonicalOrderId || input.canonicalOrderId.trim())
  );
}
