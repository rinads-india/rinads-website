/**
 * Twilio webhook signature verification (Deno / Edge Functions).
 *
 * Implements Twilio's documented algorithm exactly:
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * 1. Take the full webhook URL (as configured with Twilio, including any
 *    query string).
 * 2. For a POST request, sort the POST parameters alphabetically by key
 *    and append each key+value (no delimiter) to the URL string.
 * 3. Compute HMAC-SHA1 of that string using the Twilio Auth Token as key.
 * 4. Base64-encode the result and compare (constant-time) to the
 *    `X-Twilio-Signature` header.
 */
export async function verifyTwilioSignatureAsync(
  url: string,
  params: Record<string, string>,
  signatureHeader: string,
  authToken: string,
): Promise<boolean> {
  if (!signatureHeader) return false;

  let data = url;
  for (const key of Object.keys(params).sort()) {
    data += key + params[key];
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const expected = base64Encode(new Uint8Array(sigBuffer));

  if (expected.length !== signatureHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Twilio's WhatsApp `MessageStatus` StatusCallback values mapped to our
 * `notification_outbox.status` vocabulary. This is an intentional,
 * algorithmically-identical duplicate of
 * `packages/salon-server/src/notification-delivery.ts`'s
 * `mapTwilioStatusToOutboxStatus` — Edge Functions run on Deno and can't
 * import from the pnpm workspace, the same documented constraint that
 * already applies to `_shared/razorpay.ts` vs. the payment-webhook logic.
 * Keep both copies in sync; both are covered by their own runtime's tests.
 */
export function mapTwilioStatusToOutboxStatus(
  twilioStatus: string,
): "pending" | "processing" | "sent" | "delivered" | "read" | "failed" {
  switch (twilioStatus) {
    case "queued":
    case "accepted":
      return "pending";
    case "sending":
      return "processing";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
    case "undelivered":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Monotonic progression guard — an out-of-order or duplicate webhook
 * callback (Twilio retries webhooks that don't respond quickly) must never
 * move a message backwards (e.g. `delivered` regressing to `sent`).
 */
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  processing: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
  not_configured: 5,
  dead_letter: 5,
};

export function isForwardStatusTransition(from: string, to: string): boolean {
  const fromRank = STATUS_RANK[from] ?? 0;
  const toRank = STATUS_RANK[to] ?? 0;
  return toRank >= fromRank;
}
