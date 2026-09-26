import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

/**
 * Guards that the repository's Supabase migration ledger stays complete and
 * correctly ordered. This is the code-side of the "confirm migrations applied"
 * go-live step: applying migrations to the production project remains a founder
 * action (see docs/founder-audit/FOUNDER-SIGNOFF.md), but this test fails CI if a
 * milestone migration is accidentally removed, misnamed, or reordered.
 */

const MIGRATIONS_DIR = join(process.cwd(), "../../supabase/migrations");

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

// Milestone migrations that must exist through the salon vertical routing,
// loyalty expiry, and site_leads cutover surfaces.
const REQUIRED_MILESTONES = [
  "20260814100000_core_tenancy.sql",
  "20260816100001_rls_complete.sql",
  "20260817100000_phase12_marketplace_billing_domains.sql",
  "20260819100000_runtime_worker_persistence.sql",
  "20260820100000_site_cms.sql",
  "20260824100000_rinads_services_foundation.sql",
  "20260827100000_salon_os.sql",
  "20260916100000_salon_loyalty.sql",
  "20260916100003_fix_salon_vertical_routing.sql",
  "20260921100000_salon_loyalty_expiry.sql",
  "20260924100000_site_leads.sql",
];

describe("production migration ledger", () => {
  it("names every migration <14-digit-timestamp>_<slug>.sql", () => {
    for (const file of migrationFiles()) {
      assert.match(file, /^\d{14}_[a-z0-9_]+\.sql$/, `unexpected migration filename: ${file}`);
    }
  });

  it("has strictly increasing, unique timestamps", () => {
    const stamps = migrationFiles().map((f) => f.slice(0, 14));
    const unique = new Set(stamps);
    assert.equal(unique.size, stamps.length, "duplicate migration timestamps detected");
    const sorted = [...stamps].sort();
    assert.deepEqual(stamps, sorted, "migrations are not in ascending timestamp order");
  });

  it("contains every required milestone migration through the salon + site_leads cutover", () => {
    const files = new Set(migrationFiles());
    for (const milestone of REQUIRED_MILESTONES) {
      assert.ok(files.has(milestone), `missing required migration: ${milestone}`);
    }
  });

  it("enables RLS on tenant tables and defines tenant policies", () => {
    const commerce = readFileSync(join(MIGRATIONS_DIR, "20260814100002_commerce.sql"), "utf8");
    assert.match(commerce, /ENABLE ROW LEVEL SECURITY/i);
    const leads = readFileSync(join(MIGRATIONS_DIR, "20260924100000_site_leads.sql"), "utf8");
    assert.match(leads, /ENABLE ROW LEVEL SECURITY/i);
    const rls = readFileSync(join(MIGRATIONS_DIR, "20260816100001_rls_complete.sql"), "utf8");
    assert.match(rls, /CREATE POLICY/i);
    assert.match(rls, /is_org_member/i);
  });
});
