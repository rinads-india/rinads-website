/**
 * POST /api/social/publish/[jobId]/cancel — cancel a pending or approved job.
 * Requires staff+ role.
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

export async function POST(_request: NextRequest, { params }: Params) {
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

  const service = getSocialServiceClient();

  const { data: job, error } = await service
    .from("social_publish_jobs")
    .select("id,status,organization_id")
    .eq("id", jobId)
    .eq("organization_id", tenancy.ctx.organizationId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404, headers: NO_STORE });
  }

  const cancellable = ["pending_approval", "approved", "enqueued"];
  if (!cancellable.includes(job.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a job with status: ${job.status}.` },
      { status: 409, headers: NO_STORE }
    );
  }

  await service
    .from("social_publish_jobs")
    .update({ status: "cancelled", reviewed_by: tenancy.user.id, reviewed_at: new Date().toISOString() })
    .eq("id", jobId);

  await writeSocialAuditLog(service, {
    organizationId: tenancy.ctx.organizationId,
    actorType: "user",
    actorId: tenancy.user.id,
    action: "social.publish.cancelled",
    entity: "social_publish_jobs",
    entityId: jobId,
  });

  return NextResponse.json({ ok: true, status: "cancelled" }, { headers: NO_STORE });
}
