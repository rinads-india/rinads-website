import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PROJECT_INTAKE_MAX_BODY_BYTES,
  projectIntakeRateLimiter,
  validateProjectIntakeSubmission,
} from "@/lib/project-intake-security";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > PROJECT_INTAKE_MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }

  const rate = projectIntakeRateLimiter.check(requestIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many project submissions. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validated = validateProjectIntakeSubmission(raw);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  // Honeypot: accept without persistence so automated clients get no useful signal.
  if (validated.website?.trim()) {
    return NextResponse.json({ ok: true, submissionId: null }, { status: 202 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Project intake is temporarily unavailable. Please contact RINADS directly." },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("project_intakes")
    .insert({
      status: "submitted",
      goal: validated.goal,
      name: validated.name,
      email: validated.email,
      company: validated.company,
      phone: validated.phone,
      industry: validated.industry,
      problem: validated.problem,
      desired_outcome: validated.desiredOutcome,
      users_text: validated.users,
      current_tools: validated.currentTools,
      must_haves: validated.mustHaves,
      budget_range: validated.budgetRange,
      timeline: validated.timeline,
      selected_needs: validated.selectedNeeds,
      brief: validated.brief,
      source_path: validated.sourcePath,
      consent: validated.consent,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("project_intake_insert_failed", {
      code: error?.code,
      message: error?.message,
    });
    return NextResponse.json(
      { error: "We could not save the project brief. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      submissionId: data.id,
      status: "submitted",
    },
    { status: 201 }
  );
}
