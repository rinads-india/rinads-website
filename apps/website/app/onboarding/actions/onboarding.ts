"use server";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { provisionTenantViaRpc, seedTenantBundle, AMBADY_TENANT_SLUG, loadPublishedTemplates, type VerticalTemplateKey } from "@rinads/platform";
import { seedOrgCommerceStore } from "@rinads/commerce-server";
import { createSupabaseOperationsRepository } from "@rinads/operations-server";

export async function listOnboardingTemplatesAction(): Promise<
  { ok: true; templates: { key: string; name: string; description: string }[] } | { ok: false; error: string }
> {
  if (!isSupabaseMode()) {
    const templates = await loadPublishedTemplates();
    return {
      ok: true,
      templates: templates.map((t) => ({ key: t.key, name: t.name, description: t.description })),
    };
  }
  try {
    const supabase = await createWebsiteServerClient();
    const templates = await loadPublishedTemplates(supabase as never);
    return {
      ok: true,
      templates: templates.map((t) => ({ key: t.key, name: t.name, description: t.description })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function provisionOrganizationAction(input: {
  name: string;
  slug: string;
  templateKey: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) return { ok: false, error: "Name and slug are required." };

  const templateKey = (input.templateKey === "generic-retail" ? "generic-retail" : "ambady-nursery") as VerticalTemplateKey;

  if (!isSupabaseMode()) {
    const orgId = slug === AMBADY_TENANT_SLUG ? "org_ambady_demo" : `org_${slug.replace(/-/g, "_")}`;
    const bundle = seedTenantBundle(orgId, templateKey);
    seedOrgCommerceStore(orgId, bundle.commerce);
    createSupabaseOperationsRepository({ organizationId: orgId, initialStore: bundle.operations });
    return { ok: true, organizationId: orgId };
  }

  try {
    const supabase = await createWebsiteServerClient();
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
      { name, slug, templateKey, planKey: "starter" }
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

export async function getProvisioningJobStatusAction(organizationId: string): Promise<
  { ok: true; status: string; errorMessage?: string } | { ok: false; error: string }
> {
  if (!isSupabaseMode()) {
    return { ok: true, status: "completed" };
  }
  try {
    const supabase = await createWebsiteServerClient();
    const { data, error } = await (
      supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("tenant_provisioning_jobs")
      .select("status, error_message")
      .eq("organization_id", organizationId);

    if (error) return { ok: false, error: error.message };
    const row = data?.[0];
    return {
      ok: true,
      status: row?.status ? String(row.status) : "pending",
      errorMessage: row?.error_message ? String(row.error_message) : undefined,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
