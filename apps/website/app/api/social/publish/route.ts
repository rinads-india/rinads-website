/**
 * POST /api/social/publish — submit a social post for approval + publish.
 *
 * Body: { connectionId, text, mediaUrls?, scheduledAt? }
 * Returns: { jobId, status }
 *
 * All posts require human approval before publishing (approval gate).
 * Publishing itself happens asynchronously after approval.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getSocialServiceClient } from "@/lib/social-connections/supabase";
import {
  checkPublishRateLimit,
  requireApprovalTier,
} from "@/lib/social-connections/guard";
import { writeSocialAuditLog } from "@/lib/social-connections/audit";
import { capabilityTierFromRoleKey } from "@/lib/os-org-role";
import { loadTenancyContext } from "@rinads/tenancy";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

async function getTenancy() {
  if (!isSupabaseMode()) return null;
  const supabase = await createWebsiteServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ctx = await loadTenancyContext(supabase as never, { userId: user.id, email: user.email });
  return { user, ctx };
}

export async function POST(request: NextRequest) {
  const tenancy = await getTenancy();
  if (!tenancy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const tier = capabilityTierFromRoleKey(tenancy.ctx.roleKey);
  const gate = requireApprovalTier(tier);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403, headers: NO_STORE });
  }

  if (!checkPublishRateLimit(tenancy.ctx.organizationId)) {
    return NextResponse.json(
      { error: "Daily publish limit reached." },
      { status: 429, headers: NO_STORE }
    );
  }

  let body: {
    connectionId?: string;
    text?: string;
    mediaUrls?: string[];
    scheduledAt?: string;
    idempotencyKey?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: NO_STORE });
  }

  const { connectionId, text, mediaUrls = [], scheduledAt, idempotencyKey } = body;

  if (!connectionId || !text?.trim()) {
    return NextResponse.json(
      { error: "connectionId and text are required." },
      { status: 400, headers: NO_STORE }
    );
  }

  const service = getSocialServiceClient();

  // Idempotency check — return existing job if same key
  if (idempotencyKey) {
    const { data: existing } = await service
      .from("social_publish_jobs")
      .select("id,status")
      .eq("idempotency_key", idempotencyKey)
      .eq("organization_id", tenancy.ctx.organizationId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { jobId: existing.id, status: existing.status },
        { headers: NO_STORE }
      );
    }
  }

  try {
    // Verify the connection belongs to this org
    const { data: conn, error: connError } = await service
      .from("social_connections")
      .select("id,organization_id,provider_id,display_name")
      .eq("id", connectionId)
      .eq("organization_id", tenancy.ctx.organizationId)
      .is("disconnected_at", null)
      .single();

    if (connError || !conn) {
      return NextResponse.json(
        { error: "Connection not found." },
        { status: 404, headers: NO_STORE }
      );
    }

    // Create draft post
    const { data: post, error: postError } = await service
      .from("social_posts")
      .insert({
        organization_id: tenancy.ctx.organizationId,
        connection_id: connectionId,
        created_by: tenancy.user.id,
        body: text.trim(),
        media_urls: mediaUrls,
        scheduled_at: scheduledAt ?? null,
        status: "pending_approval",
      })
      .select("id")
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Failed to create post draft." },
        { status: 500, headers: NO_STORE }
      );
    }

    // Create publish job
    const { data: job, error: jobError } = await service
      .from("social_publish_jobs")
      .insert({
        organization_id: tenancy.ctx.organizationId,
        post_id: post.id,
        connection_id: connectionId,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        submitted_by: tenancy.user.id,
        scheduled_at: scheduledAt ?? null,
        status: "pending_approval",
      })
      .select("id,status")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Failed to create publish job." },
        { status: 500, headers: NO_STORE }
      );
    }

    await writeSocialAuditLog(service, {
      organizationId: tenancy.ctx.organizationId,
      actorType: "user",
      actorId: tenancy.user.id,
      action: "social.publish.submitted",
      entity: "social_publish_jobs",
      entityId: job.id,
      metadata: {
        provider: conn.provider_id,
        connection: conn.display_name,
        textPreview: text.slice(0, 80),
      },
    });

    return NextResponse.json(
      { jobId: job.id, status: job.status },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit post." },
      { status: 500, headers: NO_STORE }
    );
  }
}
