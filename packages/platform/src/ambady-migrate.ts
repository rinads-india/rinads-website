import type { VerticalTemplateKey } from "./templates/index";
import { seedTenantBundle, AMBADY_TENANT_SLUG } from "./templates/index";
import { seedOrgCommerceStore } from "@rinads/commerce-server";
import { createSupabaseOperationsRepository } from "@rinads/operations-server";

export type AmbadyMigrationInput = {
  /** Real organization UUID from Supabase after create_organization / provision_tenant */
  organizationId: string;
  slug?: string;
  templateKey?: VerticalTemplateKey;
};

export type AmbadyMigrationResult =
  | { ok: true; organizationId: string; slug: string }
  | { ok: false; error: string };

/**
 * Re-seed Ambady demo catalog + ops ledger under a real org row (Tenant #1).
 * Run once after CORE + platform migrations; idempotent per process memory.
 */
export function migrateAmbadyTenantSeed(input: AmbadyMigrationInput): AmbadyMigrationResult {
  const slug = (input.slug ?? AMBADY_TENANT_SLUG).trim().toLowerCase();
  if (!input.organizationId.trim()) {
    return { ok: false, error: "organizationId is required." };
  }

  try {
    const templateKey = input.templateKey ?? "ambady-nursery";
    const bundle = seedTenantBundle(input.organizationId, templateKey);
    seedOrgCommerceStore(input.organizationId, bundle.commerce);
    createSupabaseOperationsRepository({
      organizationId: input.organizationId,
      initialStore: bundle.operations,
    });
    return { ok: true, organizationId: input.organizationId, slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Migration failed." };
  }
}

export { AMBADY_TENANT_SLUG };
