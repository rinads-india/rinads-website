"use server";

import { revalidatePath } from "next/cache";
import {
  provisionTenantViaRpc,
  buildAuditInsert,
  seedTenantBundle,
  parseVerticalTemplateKey,
  resetDeadLetteredProvisioningJob,
} from "@rinads/platform";
import { createPlatformServerClient, createPlatformServiceClient } from "@/lib/supabase/server";
import { requirePlatformTenancy } from "@/lib/tenancy";
import { isDemoMode } from "@/lib/supabase/env";
import { seedOrgCommerceStore } from "@rinads/commerce-server";
import { createSupabaseOperationsRepository } from "@rinads/operations-server";

export async function provisionTenantAction(input: {
  name: string;
  slug: string;
  templateKey: string;
  planKey: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string }> {
  try {
    await requirePlatformTenancy();
    const templateKey = parseVerticalTemplateKey(input.templateKey);

    if (isDemoMode()) {
      const orgId = `org_${input.slug.replace(/-/g, "_")}`;
      const bundle = seedTenantBundle(orgId, templateKey);
      seedOrgCommerceStore(orgId, bundle.commerce);
      createSupabaseOperationsRepository({ organizationId: orgId, initialStore: bundle.operations });
      return { ok: true, organizationId: orgId };
    }

    const supabase = await createPlatformServerClient();
    const result = await provisionTenantViaRpc(
      async (args) => {
        const { data, error } = await (
          supabase as unknown as {
            rpc: (
              fn: string,
              args: Record<string, string>
            ) => Promise<{ data: { id: string; slug: string } | null; error: { message: string } | null }>;
          }
        ).rpc("provision_tenant", args);
        return { data, error };
      },
      { ...input, templateKey }
    );

    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    if (!result.organizationId) {
      return { ok: false, error: "Provision failed" };
    }

    return { ok: true, organizationId: result.organizationId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function setTenantStatusAction(
  organizationId: string,
  status: "active" | "suspended" | "archived"
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const tenancy = await requirePlatformTenancy();

    if (isDemoMode()) {
      return { ok: true };
    }

    const service = createPlatformServiceClient();
    const { error } = await (
      service as unknown as {
        rpc: (
          fn: string,
          args: { p_org_id: string; p_status: string }
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("set_organization_status", { p_org_id: organizationId, p_status: status });

    if (error) return { ok: false, error: error.message };

    await (
      service.from("audit_logs") as unknown as {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      }
    ).insert(
      buildAuditInsert({
        organizationId,
        actorType: "user",
        actorId: tenancy.userId,
        action: "tenant.status_changed",
        entity: "organization",
        entityId: organizationId,
        after: { status },
        source: "platform-admin",
      })
    );

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function listTenantsAction(): Promise<
  { ok: true; tenants: { id: string; name: string; slug: string; status: string }[] } | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();

    if (isDemoMode()) {
      return {
        ok: true,
        tenants: [
          { id: "org_ambady_demo", name: "Ambady Nursery", slug: "ambady", status: "active" },
        ],
      };
    }
    const service = createPlatformServiceClient();
    const { data, error } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
        };
      }
    ).from("organizations").select("id, name, slug, status");

    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      tenants: (data ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        slug: String(row.slug),
        status: String(row.status),
      })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export type ProvisioningJobSummary = {
  id: string;
  organizationId: string;
  templateKey: string;
  status: string;
  attempts: number;
  nextAttemptAt?: string;
  errorMessage?: string;
  lastErrorClass?: string;
  deadLetteredAt?: string;
};

export async function listProvisioningJobsAction(): Promise<
  { ok: true; jobs: ProvisioningJobSummary[] } | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();
    if (isDemoMode()) return { ok: true, jobs: [] };

    const service = createPlatformServiceClient();
    const { data, error } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => Promise<{
            data: Record<string, unknown>[] | null;
            error: { message: string } | null;
          }>;
        };
      }
    )
      .from("tenant_provisioning_jobs")
      .select(
        "id, organization_id, template_key, status, attempts, next_attempt_at, error_message, last_error_class, dead_lettered_at"
      );

    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      jobs: (data ?? []).map((row) => ({
        id: String(row.id),
        organizationId: String(row.organization_id),
        templateKey: String(row.template_key),
        status: String(row.status),
        attempts: Number(row.attempts ?? 0),
        nextAttemptAt: row.next_attempt_at ? String(row.next_attempt_at) : undefined,
        errorMessage: row.error_message ? String(row.error_message) : undefined,
        lastErrorClass: row.last_error_class ? String(row.last_error_class) : undefined,
        deadLetteredAt: row.dead_lettered_at ? String(row.dead_lettered_at) : undefined,
      })),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error" };
  }
}

export async function retryDeadLetteredProvisioningJobAction(
  jobId: string,
  _formData: FormData
): Promise<void> {
  const tenancy = await requirePlatformTenancy();
  if (isDemoMode()) return;

  const service = createPlatformServiceClient();
  const { data: job, error } = await (
    service as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            single: () => Promise<{
              data: Record<string, unknown> | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .from("tenant_provisioning_jobs")
    .select("id, organization_id, status")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error(error?.message ?? "Provisioning job not found");
  if (String(job.status) !== "dead_letter") {
    throw new Error("Only dead-lettered provisioning jobs can be manually retried");
  }

  const reset = await resetDeadLetteredProvisioningJob(service as never, jobId);
  if (!reset) throw new Error("Could not reset provisioning job");

  const organizationId = String(job.organization_id);
  await (
    service.from("audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    }
  ).insert(
    buildAuditInsert({
      organizationId,
      actorType: "user",
      actorId: tenancy.userId,
      action: "tenant.provisioning.manual_retry",
      entity: "tenant_provisioning_job",
      entityId: jobId,
      after: { status: "pending", attempts: 0 },
      source: "platform-admin",
    })
  );

  revalidatePath("/tenants");
}

export async function listPlansAction(): Promise<
  { ok: true; plans: { key: string; name: string; limits: Record<string, unknown> }[] } | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();

    if (isDemoMode()) {
      return {
        ok: true,
        plans: [
          { key: "starter", name: "Starter", limits: { modules: ["commerce", "inventory"], ordersPerMonth: 100 } },
          { key: "growth", name: "Growth", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment"], ordersPerMonth: 1000 } },
          { key: "platform", name: "Platform", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment", "crm", "tasks"], ordersPerMonth: 10000 } },
        ],
      };
    }

    const service = createPlatformServiceClient();
    const { data, error } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: boolean) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("plans")
      .select("key, name, limits")
      .eq("is_active", true);

    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      plans: (data ?? []).map((row) => ({
        key: String(row.key),
        name: String(row.name),
        limits: (row.limits as Record<string, unknown>) ?? {},
      })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
