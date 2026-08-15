import { seedTenantBundle, type VerticalTemplateKey } from "./templates/index";
import type { ProvisionTenantInput, ProvisionTenantResult } from "./types";

export type TenantStoreRegistry = {
  register(orgId: string, templateKey: VerticalTemplateKey): void;
  has(orgId: string): boolean;
};

/** In-memory tenant seed — used when Supabase RPC not available or after provision. */
export function provisionTenantInMemory(
  registry: TenantStoreRegistry,
  input: ProvisionTenantInput & { organizationId: string }
): ProvisionTenantResult {
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!input.name.trim() || !slug) {
    return { ok: false, error: "Name and slug are required." };
  }

  const templateKey = (input.templateKey ?? "ambady-nursery") as VerticalTemplateKey;
  try {
    seedTenantBundle(input.organizationId, templateKey);
    registry.register(input.organizationId, templateKey);
    return { ok: true, organizationId: input.organizationId, slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Seed failed." };
  }
}

export async function provisionTenantViaRpc(
  rpc: (args: {
    p_name: string;
    p_slug: string;
    p_template_key: string;
    p_plan_key: string;
  }) => Promise<{ data: { id: string; slug: string } | null; error: { message: string } | null }>,
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const { data, error } = await rpc({
    p_name: input.name.trim(),
    p_slug: slug,
    p_template_key: input.templateKey ?? "ambady-nursery",
    p_plan_key: input.planKey ?? "starter",
  });

  if (error) return { ok: false, error: error.message };
  if (!data?.id) return { ok: false, error: "Organization not returned." };
  return { ok: true, organizationId: data.id, slug: data.slug };
}
