import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20261024041500_external_agent_delegations.sql",
    import.meta.url
  ),
  "utf8"
);

describe("external_agent_delegations security", () => {
  it("enables RLS and revokes browser-role table privileges before granting narrow access", () => {
    assert.match(
      migration,
      /alter table public\.external_agent_delegations enable row level security/i
    );
    assert.match(
      migration,
      /revoke all privileges on table public\.external_agent_delegations from anon/i
    );
    assert.match(
      migration,
      /revoke all privileges on table public\.external_agent_delegations from authenticated/i
    );
    assert.match(
      migration,
      /grant select, insert on table public\.external_agent_delegations to authenticated/i
    );
    assert.doesNotMatch(
      migration,
      /grant\s+(?:[^;]*\bupdate\b|[^;]*\bdelete\b)[^;]*external_agent_delegations[^;]*authenticated/i
    );
  });

  it("binds issuance to the authenticated user and active organization membership", () => {
    assert.match(migration, /user_id\s*=\s*auth\.uid\(\)/i);
    assert.match(migration, /private\.is_org_member\(organization_id\)/i);
  });

  it("keeps delegation scopes on the initial READ-only allowlist", () => {
    assert.match(migration, /intelligence\.business_summary\.read/i);
    assert.match(migration, /commerce\.catalog\.read/i);
    assert.match(migration, /commerce\.order\.read/i);
    assert.doesNotMatch(migration, /communication\.message\.send/i);
    assert.doesNotMatch(migration, /growth\.campaign\.launch/i);
    assert.doesNotMatch(migration, /commerce\.checkout\.create/i);
  });

  it("caps persisted delegation lifetime at one hour", () => {
    assert.match(
      migration,
      /expires_at\s*<=\s*issued_at\s*\+\s*interval\s*'1 hour'/i
    );
  });

  it("allows revocation only through a narrow authenticated RPC", () => {
    assert.match(
      migration,
      /create or replace function public\.revoke_external_agent_delegation\(p_token_id text\)/i
    );
    assert.match(migration, /if auth\.uid\(\) is null then/i);
    assert.match(migration, /d\.user_id\s*=\s*auth\.uid\(\)/i);
    assert.match(migration, /private\.is_org_member\(d\.organization_id\)/i);
    assert.match(
      migration,
      /grant execute on function public\.revoke_external_agent_delegation\(text\) to authenticated/i
    );
  });
});
