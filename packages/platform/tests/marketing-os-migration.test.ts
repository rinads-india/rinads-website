import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const migration = readFileSync(
  join(
    process.cwd(),
    "../../supabase/migrations/20261019060000_marketing_os_phase0.sql",
  ),
  "utf8",
);

describe("Marketing OS Phase 0 migration", () => {
  it("uses canonical organization tenancy and RLS", () => {
    assert.match(migration, /organization_id UUID NOT NULL REFERENCES public\.organizations/);
    assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
    assert.match(migration, /private\.has_permission\(organization_id, ''marketing\.read''\)/);
  });

  it("does not persist raw provider access or refresh tokens", () => {
    assert.match(migration, /credential_ref TEXT/);
    assert.doesNotMatch(migration, /access_token\s+TEXT/i);
    assert.doesNotMatch(migration, /refresh_token\s+TEXT/i);
  });

  it("enforces same-organization relationships and idempotent publications", () => {
    assert.match(migration, /channel_accounts_connection_same_org_fk/);
    assert.match(migration, /marketing_publications_account_same_org_fk/);
    assert.match(migration, /UNIQUE \(organization_id, idempotency_key\)/);
  });

  it("keeps attempts and metrics server-written", () => {
    assert.doesNotMatch(migration, /marketing_publication_attempts_insert/i);
    assert.doesNotMatch(migration, /marketing_metric_snapshots_insert/i);
  });
});
