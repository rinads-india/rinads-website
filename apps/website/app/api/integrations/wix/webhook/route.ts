import { verifyAndDecodeWixWebhook } from "@/lib/integrations/wix-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 1_000_000;

export async function POST(request: Request) {
  const publicKey = process.env.WIX_WEBHOOK_PUBLIC_KEY?.trim();
  const appId = process.env.WIX_APP_ID?.trim();
  const eventSinkUrl = process.env.RINADS_WIX_EVENT_SINK_URL?.trim();
  const eventSinkSecret = process.env.RINADS_WIX_EVENT_SINK_SECRET?.trim();

  if (!publicKey || !appId || !eventSinkUrl || !eventSinkSecret) {
    return Response.json(
      { ok: false, error: "Wix connector is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawToken = await request.text();
  if (!rawToken || Buffer.byteLength(rawToken, "utf8") > MAX_WEBHOOK_BYTES) {
    return Response.json(
      { ok: false, error: "Invalid webhook payload" },
      { status: rawToken ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let event;
  try {
    event = verifyAndDecodeWixWebhook(rawToken, { publicKey, appId });
  } catch {
    return Response.json(
      { ok: false, error: "Webhook verification failed" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let sinkResponse: Response;
  try {
    sinkResponse = await fetch(eventSinkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RINADS-Integration-Secret": eventSinkSecret,
        "X-RINADS-Provider": "wix",
        "X-RINADS-Event-ID": event.eventId,
      },
      body: JSON.stringify(event),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return Response.json(
      { ok: false, error: "RINADS event sink unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!sinkResponse.ok) {
    return Response.json(
      { ok: false, error: "RINADS event sink rejected the event" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
