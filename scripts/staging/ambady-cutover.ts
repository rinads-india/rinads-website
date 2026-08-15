#!/usr/bin/env node
/**
 * Ambady Tenant #1 cutover helper (Phase 11 WS11).
 *
 * After `provision_tenant` creates org slug `ambady` in Supabase, run:
 *   pnpm staging:ambady-seed -- --org-id <uuid-from-rpc>
 *
 * Demo mode (no Supabase):
 *   USE_DEMO_STORE=1 pnpm staging:ambady-seed
 */
import {
  migrateAmbadyTenantSeed,
  AMBADY_TENANT_SLUG,
} from "@rinads/platform";

function parseArgs(argv: string[]): { orgId?: string; slug?: string } {
  let orgId: string | undefined;
  let slug: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--org-id" && argv[i + 1]) orgId = argv[++i];
    if (argv[i] === "--slug" && argv[i + 1]) slug = argv[++i];
  }
  return { orgId, slug };
}

const { orgId, slug } = parseArgs(process.argv.slice(2));
const isDemo = process.env.USE_DEMO_STORE === "1" || process.env.USE_SUPABASE !== "1";

const resolvedOrgId = orgId ?? (isDemo ? "org_ambady_demo" : undefined);

if (!resolvedOrgId) {
  console.error(
    "Missing --org-id. Provision Ambady first:\n" +
      "  SELECT id FROM organizations WHERE slug = 'ambady';\n" +
      "Then: pnpm staging:ambady-seed -- --org-id <uuid>"
  );
  process.exit(1);
}

const result = migrateAmbadyTenantSeed({
  organizationId: resolvedOrgId,
  slug: slug ?? AMBADY_TENANT_SLUG,
});

if (!result.ok) {
  console.error("Cutover failed:", result.error);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      organizationId: result.organizationId,
      slug: result.slug,
      mode: isDemo ? "demo" : "supabase-app-seed",
      note: "Commerce/ops seed loaded in process memory. With USE_SUPABASE=1, adapters sync on saveStore.",
    },
    null,
    2
  )
);
