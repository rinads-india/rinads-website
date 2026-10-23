import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/20261024003000_payment_webhook_events_rls.sql",
    import.meta.url
  ),
  "utf8"
);

describe("payment_webhook_events security", () => {
  it("enables RLS and removes browser-role table privileges", () => {
    assert.match(
      migration,
      /alter table public\.payment_webhook_events enable row level security/i
    );
    assert.match(
      migration,
      /revoke all privileges on table public\.payment_webhook_events from anon/i
    );
    assert.match(
      migration,
      /revoke all privileges on table public\.payment_webhook_events from authenticated/i
    );
  });

  it("does not create a browser-readable policy in the hardening migration", () => {
    assert.doesNotMatch(migration, /create\s+policy/i);
  });
});
