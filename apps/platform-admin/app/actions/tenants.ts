"use server";

import { provisionTenantViaRpc, buildAuditInsert, seedTenantBundle } from "@rinads/platform";
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

    if (isDemoMode()) {
      const orgId = `org_${input.slug.replace(/-/g, "_")}`;
      const bundle = seedTenantBundle(orgId, input.templateKey as "ambady-nursery");
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
      input
    );

    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    if (!result.organizationId) {
      return { ok: false, error: "Provision failed" };
    }

    const bundle = seedTenantBundle(result.organizationId, input.templateKey as "ambady-nursery");
    seedOrgCommerceStore(result.organizationId, bundle.commerce);
    createSupabaseOperationsRepository({
      organizationId: result.organizationId,
      initialStore: bundle.operations,
    });

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

export async function listPlansAction(): Promise<
  { ok: true; plans: { key: string; name: string; limits: Record<string, unknown> }[] } | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();

    if (isDemoMode()) {
      return {
        ok: true,
        plans: [
          { key: "starter", name: "Starter", limits: { modules: ["commerce", "inventory"] } },
          { key: "growth", name: "Growth", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment"] } },
          { key: "platform", name: "Platform", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment", "crm", "tasks"] } },
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
