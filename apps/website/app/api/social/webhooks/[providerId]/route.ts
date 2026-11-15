/**
 * GET  /api/social/webhooks/[providerId] — webhook verification challenge (Meta hub.verify)
 * POST /api/social/webhooks/[providerId] — receive signed webhook payloads
 */
import { NextRequest, NextResponse } from "next/server";
import { getSocialServiceClient } from "@/lib/social-connections/supabase";
import { getProviderAdapter } from "@/lib/social-connections/providers/index";
import type { SocialProviderId } from "@/lib/social-connections/types";
import type { Json } from "@rinads/database";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ providerId: string }> };

/** Meta hub.verify challenge */
export async function GET(request: NextRequest, { params }: Params) {
  const { providerId } = await params;
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const verifyToken = process.env[`SOCIAL_WEBHOOK_VERIFY_TOKEN_${providerId.toUpperCase()}`]
    ?? process.env.SOCIAL_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken || token !== verifyToken) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/** Signed webhook payload */
export async function POST(request: NextRequest, { params }: Params) {
  const { providerId } = await params;

  const rawBody = await request.arrayBuffer();
  const bodyBytes = Buffer.from(rawBody);
  const bodyText = bodyBytes.toString("utf-8");

  const adapter = getProviderAdapter(providerId as SocialProviderId);
  if (!adapter) {
    return new NextResponse("Unknown provider", { status: 404 });
  }

  // Verify HMAC signature
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const appSecret = process.env[`SOCIAL_APP_SECRET_${providerId.toUpperCase()}`] ?? "";

  if (!appSecret) {
    console.error(`[webhook/${providerId}] No app secret configured — refusing payload`);
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  const valid = await adapter.verifyWebhook(bodyBytes, signature, appSecret);
  if (!valid) {
    console.warn(`[webhook/${providerId}] Invalid signature`);
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: Json;
  try {
    payload = JSON.parse(bodyText) as Json;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // Persist only verified JSON; a provider may retry if persistence fails.
  const eventType = payload && typeof payload === "object" && !Array.isArray(payload)
    && typeof payload.object === "string" ? payload.object : "unknown";
  const service = getSocialServiceClient();
  const { error: persistenceError } = await service.from("social_webhook_events").insert({
    provider_id: adapter.id,
    event_type: eventType,
    payload,
    signature_valid: true,
  });
  if (persistenceError) {
    console.error("[social/webhook] Verified event could not be persisted");
    return new NextResponse("Unavailable", { status: 503 });
  }

  // Respond only after successful persistence; actual processing is async
  return new NextResponse("OK", { status: 200 });
}
