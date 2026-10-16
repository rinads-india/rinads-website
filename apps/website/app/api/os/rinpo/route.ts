import { NextRequest, NextResponse } from "next/server";
import { answerCompanyQuestion, buildFounderSnapshot, can, detectBriefingIntent } from "@rinads/company-os";
import { loadCompanyFacts } from "@rinads/company-os-server";
import { getApiCompanyOsSession } from "@/lib/company-os/api-session";
import { getEngineeringFacts } from "@/lib/company-os/engineering";
import { memberNames } from "@/lib/company-os/names";
import { createRateLimiter } from "@/lib/chat-security";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter(60_000, 20);
const MAX_QUESTION = 500;

/**
 * RINPO company briefing — "How is RINADS today?".
 *
 * Authenticated, tenant-scoped and read-only. It answers deterministically from the caller's own
 * permission-filtered company facts (RLS session; no service role). It makes NO model call and
 * mutates nothing; any action it suggests must be submitted through the governed pipeline.
 * When it cannot answer (demo mode, no organisation, or a question that is not about the company)
 * it says so and the dock falls back to the public rule-based chat.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const question = typeof (body as { message?: unknown })?.message === "string" ? (body as { message: string }).message.trim() : "";
  if (!question || question.length > MAX_QUESTION) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const session = await getApiCompanyOsSession();
  if (session.kind === "unauthenticated") return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.kind === "demo") return NextResponse.json({ available: false, reason: "demo_mode" });
  if (session.kind === "no-org") return NextResponse.json({ available: false, reason: "no_organisation" });

  const rate = limiter.check(`${session.ctx.organizationId}:${session.ctx.userId}`);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } });

  if (detectBriefingIntent(question) === "unknown") return NextResponse.json({ available: true, matched: false });

  const now = new Date();
  const engineering = can(session.ctx, "engineering.read") ? await getEngineeringFacts() : undefined;
  const { facts } = await loadCompanyFacts({ db: session.db, ctx: session.ctx, organizationName: session.organizationName, now, engineering });
  const briefing = answerCompanyQuestion(question, buildFounderSnapshot(facts, now), { memberNames: memberNames(facts) });

  return NextResponse.json(
    { available: true, matched: true, reply: briefing.text, briefing: { ...briefing, text: undefined } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
