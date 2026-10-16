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

/** Map phone-only leads onto NOT NULL work_email column without inventing a mailbox. */
function persistenceEmail(payload: LeadPayload): string {
  if (payload.workEmail) return payload.workEmail;
  const digits = (payload.phone ?? "").replace(/\D/g, "");
  return digits ? `phone:${digits}@lead.pending` : "unknown@lead.pending";
}

function enrichMessage(payload: LeadPayload): string | null {
  const parts: string[] = [];
  if (payload.phone) parts.push(`Phone: ${payload.phone}`);
  if (payload.websiteUrl) parts.push(`Website: ${payload.websiteUrl}`);
  if (payload.stage) parts.push(`Stage: ${payload.stage}`);
  if (payload.structured?.industry) parts.push(`Industry: ${payload.structured.industry}`);
  if (payload.structured?.captureSource) parts.push(`Capture: ${payload.structured.captureSource}`);
  if (payload.structured?.currentTools?.length) {
    parts.push(`Tools: ${payload.structured.currentTools.join(", ")}`);
  }
  if (payload.message) parts.push(payload.message);
  return parts.length ? parts.join("\n") : null;
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
      work_email: persistenceEmail(payload),
      company: payload.company,
      role: payload.role,
      company_size: payload.companySize || "unspecified",
      industry: payload.industry || "unspecified",
      current_tools: payload.currentTools ?? null,
      problem: payload.problem,
      timeline: payload.timeline || "unspecified",
      budget: payload.budget ?? null,
      message: enrichMessage(payload),
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
  const contact = payload.workEmail || payload.phone || "";
  return `${contact}|${payload.outcome}|${payload.company}|${payload.stage ?? "complete"}`.toLowerCase();
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
      message:
        validated.value.stage === "step1"
          ? "We already captured this lead. Continue with optional details."
          : "We already received this enquiry. Our team will follow up.",
    });
  }
  recentFingerprints.set(fp, now);

  try {
    const result = await storeLead(validated.value);
    const isStep1 = validated.value.stage === "step1";
    return NextResponse.json({
      ok: true,
      stored: result.stored,
      duplicate: result.duplicate ?? false,
      id: result.id,
      stage: validated.value.stage,
      message: result.stored
        ? isStep1
          ? "Thanks — your lead was saved. Add optional details to help us prepare."
          : "Thanks — your enquiry was saved. Our team will follow up."
        : isStep1
          ? "Thanks — your lead was accepted. Persistence is pending configuration."
          : "Thanks — your enquiry was accepted. Persistence is pending configuration; our team can still follow up from this receipt.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not submit your enquiry right now. Please try again." },
      { status: 503 },
    );
  }
}
