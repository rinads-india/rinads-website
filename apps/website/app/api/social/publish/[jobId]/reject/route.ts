/**
 * POST /api/social/publish/[jobId]/reject — reject a pending publish job.
 * Requires staff+ role. Body: { reason?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getSocialServiceClient } from "@/lib/social-connections/supabase";
import { requireApprovalTier } from "@/lib/social-connections/guard";
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

type Params = { params: Promise<{ jobId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { jobId } = await params;

  const tenancy = await getTenancy();
  if (!tenancy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const tier = capabilityTierFromRoleKey(tenancy.ctx.roleKey);
  const gate = requireApprovalTier(tier);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403, headers: NO_STORE });
  }

  let reason: string | undefined;
  try {
    const body = await request.json();
    reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : undefined;
  } catch {
    // reason is optional
  }

  const service = getSocialServiceClient();

  const { data: job, error } = await service
    .from("social_publish_jobs")
    .select("id,status,organization_id,post_id")
    .eq("id", jobId)
    .eq("organization_id", tenancy.ctx.organizationId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404, headers: NO_STORE });
  }

  if (job.status !== "pending_approval") {
    return NextResponse.json(
      { error: `Job is not pending approval (status: ${job.status}).` },
      { status: 409, headers: NO_STORE }
    );
  }

  const now = new Date().toISOString();

  const [jobUpdate, postUpdate] = await Promise.all([
    service
      .from("social_publish_jobs")
      .update({
        status: "rejected",
        reviewed_by: tenancy.user.id,
        reviewed_at: now,
        rejection_reason: reason ?? null,
      })
      .eq("id", jobId),
    service
      .from("social_posts")
      .update({ status: "rejected" })
      .eq("id", job.post_id),
  ]);

  if (jobUpdate.error || postUpdate.error) {
    return NextResponse.json({ error: "Failed to reject job." }, { status: 500, headers: NO_STORE });
  }

  await writeSocialAuditLog(service, {
    organizationId: tenancy.ctx.organizationId,
    actorType: "user",
    actorId: tenancy.user.id,
    action: "social.publish.rejected",
    entity: "social_publish_jobs",
    entityId: jobId,
    metadata: reason ? { reason } : undefined,
  });

  return NextResponse.json({ ok: true, status: "rejected" }, { headers: NO_STORE });
}
