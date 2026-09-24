import { NextResponse } from "next/server";
import { validateLeadPayload, type LeadPayload } from "@/lib/content/leads";

export const runtime = "nodejs";

type StoreResult = { stored: boolean; duplicate?: boolean; id?: string };

/**
 * Persist lead when a webhook or service role path is configured.
 * Otherwise accept and acknowledge without inventing CRM success claims.
 */
async function storeLead(payload: LeadPayload): Promise<StoreResult> {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    return { stored: false };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.LEAD_WEBHOOK_SECRET
        ? { authorization: `Bearer ${process.env.LEAD_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      ...payload,
      receivedAt: new Date().toISOString(),
      source: "rinads-website",
    }),
  });

  if (!res.ok) {
    throw new Error(`Lead webhook failed: ${res.status}`);
  }

  const body = (await res.json().catch(() => ({}))) as { id?: string; duplicate?: boolean };
  return { stored: true, id: body.id, duplicate: body.duplicate };
}

const recentFingerprints = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function fingerprint(payload: LeadPayload) {
  return `${payload.workEmail}|${payload.outcome}|${payload.company}`.toLowerCase();
}

export async function POST(request: Request) {
  let body: Partial<LeadPayload>;
  try {
    body = (await request.json()) as Partial<LeadPayload>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateLeadPayload(body);
  if (!validated.ok || !validated.value) {
    return NextResponse.json({ ok: false, errors: validated.errors }, { status: 400 });
  }

  const fp = fingerprint(validated.value);
  const now = Date.now();
  const last = recentFingerprints.get(fp);
  if (last && now - last < DEDUPE_WINDOW_MS) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      message: "We already received this enquiry. Our team will follow up.",
    });
  }
  recentFingerprints.set(fp, now);

  try {
    const result = await storeLead(validated.value);
    return NextResponse.json({
      ok: true,
      stored: result.stored,
      duplicate: result.duplicate ?? false,
      id: result.id,
      message: result.stored
        ? "Thanks — your enquiry was received."
        : "Thanks — your enquiry was received. Our team will follow up.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not submit your enquiry right now. Please try again." },
      { status: 503 },
    );
  }
}
