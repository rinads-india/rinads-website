import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@rinads/database";
import { validateLeadPayload, type LeadPayload } from "@/lib/content/leads";

export const runtime = "nodejs";

type StoreResult = { stored: boolean; duplicate?: boolean; id?: string };

function hasSupabaseServiceRole(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function storeLeadViaWebhook(payload: LeadPayload, webhook: string): Promise<StoreResult> {
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

async function storeLeadViaSupabase(payload: LeadPayload): Promise<StoreResult> {
  const client = createServiceRoleClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });

  const { data, error } = await client
    .from("site_leads")
    .insert({
      outcome: payload.outcome,
      name: payload.name,
      work_email: payload.workEmail,
      company: payload.company,
      role: payload.role,
      company_size: payload.companySize,
      industry: payload.industry,
      current_tools: payload.currentTools ?? null,
      problem: payload.problem,
      timeline: payload.timeline,
      budget: payload.budget ?? null,
      message: payload.message ?? null,
      intent: payload.intent ?? null,
      plan: payload.plan ?? null,
      source_path: payload.sourcePath ?? null,
      privacy_accepted: payload.privacyAccepted,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Lead Supabase insert failed: ${error.message}`);
  }

  return { stored: true, id: data?.id };
}

/**
 * Persist lead when a webhook or service role path is configured.
 * Order: LEAD_WEBHOOK_URL → site_leads via service role → honest ack (stored: false).
 */
async function storeLead(payload: LeadPayload): Promise<StoreResult> {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    return storeLeadViaWebhook(payload, webhook);
  }

  if (hasSupabaseServiceRole()) {
    return storeLeadViaSupabase(payload);
  }

  return { stored: false };
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
        ? "Thanks — your enquiry was saved. Our team will follow up."
        : "Thanks — your enquiry was accepted. Persistence is pending configuration; our team can still follow up from this receipt.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not submit your enquiry right now. Please try again." },
      { status: 503 },
    );
  }
}
