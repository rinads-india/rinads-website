"use server";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { provisionTenantViaRpc } from "@rinads/platform";
import { seedTenantBundle, AMBADY_TENANT_SLUG } from "@rinads/platform";
import { seedOrgCommerceStore } from "@rinads/commerce-server";
import { createSupabaseOperationsRepository } from "@rinads/operations-server";

export async function provisionOrganizationAction(input: {
  name: string;
  slug: string;
  templateKey: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) return { ok: false, error: "Name and slug are required." };

  if (!isSupabaseMode()) {
    const orgId = slug === AMBADY_TENANT_SLUG ? "org_ambady_demo" : `org_${slug.replace(/-/g, "_")}`;
    const bundle = seedTenantBundle(orgId, "ambady-nursery");
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
      { name, slug, templateKey: input.templateKey, planKey: "starter" }
    );

    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    if (!result.organizationId) {
      return { ok: false, error: "Provision failed" };
    }

    const bundle = seedTenantBundle(result.organizationId, "ambady-nursery");
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
