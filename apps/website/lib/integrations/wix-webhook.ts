import { createHash, createPublicKey, verify } from "node:crypto";

type JsonRecord = Record<string, unknown>;

export type VerifiedWixWebhookEvent = {
  provider: "wix";
  eventId: string;
  eventType: string;
  instanceId: string;
  data: unknown;
  identity: unknown;
  receivedAt: string;
};

type VerifyWixWebhookOptions = {
  publicKey: string;
  appId?: string;
  nowSeconds?: number;
};

function decodeBase64UrlJson(segment: string): JsonRecord {
  const value = Buffer.from(segment, "base64url").toString("utf8");
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid Wix JWT JSON payload");
  }
  return parsed as JsonRecord;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function asRecord(value: unknown): JsonRecord | null {
  const parsed = parseMaybeJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as JsonRecord;
}

function normalizePublicKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

function audienceMatches(audience: unknown, appId: string): boolean {
  if (typeof audience === "string") return audience === appId;
  if (Array.isArray(audience)) return audience.some((item) => item === appId);
  return false;
}

function stringId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Wix entity events carry a provider-generated event ID inside their event
 * metadata envelope. Use it for at-least-once dedupe so a retry remains the
 * same event even if Wix re-signs the outer JWT. Lifecycle events that do not
 * expose such an ID fall back to a digest of the verified signed token.
 */
function providerEventId(eventData: unknown): string | null {
  const data = asRecord(eventData);
  if (!data) return null;

  for (const key of ["createdEvent", "updatedEvent", "deletedEvent", "actionEvent"]) {
    const envelope = asRecord(data[key]);
    const id = stringId(envelope?.id);
    if (id) return id;
  }

  const metadata = asRecord(data.metadata);
  return stringId(metadata?.id);
}

export function verifyAndDecodeWixWebhook(
  token: string,
  options: VerifyWixWebhookOptions,
): VerifiedWixWebhookEvent {
  const trimmedToken = token.trim();
  const parts = trimmedToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed Wix webhook JWT");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson(encodedHeader);
  if (header.alg !== "RS256") throw new Error("Unsupported Wix webhook JWT algorithm");

  const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const signature = Buffer.from(encodedSignature, "base64url");
  const verified = verify(
    "RSA-SHA256",
    signingInput,
    createPublicKey(normalizePublicKey(options.publicKey)),
    signature,
  );
  if (!verified) throw new Error("Invalid Wix webhook JWT signature");

  const claims = decodeBase64UrlJson(encodedPayload);
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (typeof claims.exp === "number" && claims.exp < nowSeconds) {
    throw new Error("Expired Wix webhook JWT");
  }
  if (typeof claims.nbf === "number" && claims.nbf > nowSeconds) {
    throw new Error("Wix webhook JWT is not active yet");
  }
  if (typeof claims.iss === "string" && claims.iss !== "wix.com") {
    throw new Error("Unexpected Wix webhook JWT issuer");
  }
  if (claims.aud !== undefined && options.appId && !audienceMatches(claims.aud, options.appId)) {
    throw new Error("Unexpected Wix webhook JWT audience");
  }

  let event = asRecord(claims.data);
  if (!event) throw new Error("Missing Wix webhook event payload");

  const nestedEvent = asRecord(event.data);
  if (!event.eventType && nestedEvent?.eventType) event = nestedEvent;

  const eventType = typeof event.eventType === "string" ? event.eventType : "";
  const instanceId = typeof event.instanceId === "string" ? event.instanceId : "";
  if (!eventType || !instanceId) {
    throw new Error("Wix webhook event is missing eventType or instanceId");
  }

  const eventData = parseMaybeJson(event.data);
  const stableProviderEventId = providerEventId(eventData);

  return {
    provider: "wix",
    eventId: stableProviderEventId ?? createHash("sha256").update(trimmedToken).digest("hex"),
    eventType,
    instanceId,
    data: eventData,
    identity: parseMaybeJson(event.identity),
    receivedAt: new Date(nowSeconds * 1000).toISOString(),
  };
}
