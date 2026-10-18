import { NextRequest, NextResponse } from "next/server";
import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
import { readLiveConfig } from "@/lib/rinpo-live/config";
import { createLiveGuards } from "@/lib/rinpo-live/guard";
import {
  DEFAULT_LIVE_LANGUAGE,
  isLiveLanguageCode,
} from "@/lib/rinpo-live/languages";
import { createLiveSession } from "@/lib/rinpo-live/session";

export const dynamic = "force-dynamic";

const guards = createLiveGuards();
const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Capability probe. The UI calls this first so a deployment without Runway
 * credentials shows an honest "not enabled" state instead of a broken call.
 */
export async function GET() {
  const config = readLiveConfig();
  return NextResponse.json(
    {
      enabled: config !== null,
      maxDurationSeconds: config?.maxDurationSeconds ?? null,
    },
    { headers: NO_STORE },
  );
}

/**
 * Starts a Runway Character session and returns one-time WebRTC credentials.
 * Body: `{ language?: LiveLanguageCode }` (defaults to auto-detect).
 */
export async function POST(request: NextRequest) {
  const config = readLiveConfig();
  if (!config) {
    return NextResponse.json(
      { error: "RINPO Live is not enabled on this deployment." },
      { status: 503, headers: NO_STORE },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const verdict = guards.check(
    {
      ip,
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
      siteUrl: COMPANY_CONFIG.siteUrl,
    },
    config,
  );
  if (!verdict.ok) {
    return NextResponse.json(
      { error: verdict.error },
      {
        status: verdict.status,
        headers:
          verdict.status === 429
            ? { ...NO_STORE, "Retry-After": String(verdict.retryAfterSec) }
            : NO_STORE,
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const requested = (body as { language?: unknown } | null)?.language;
  if (requested !== undefined && !isLiveLanguageCode(requested)) {
    return NextResponse.json(
      { error: "Unsupported language." },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const session = await createLiveSession(
      config,
      requested ?? DEFAULT_LIVE_LANGUAGE,
    );
    return NextResponse.json(session, { headers: NO_STORE });
  } catch (error) {
    // Provider detail stays in the server log — never in the response.
    console.error("[rinpo-live] session start failed", error);
    return NextResponse.json(
      { error: "RINPO Live could not start right now. Please try again." },
      { status: 502, headers: NO_STORE },
    );
  }
}
