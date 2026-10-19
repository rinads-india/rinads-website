import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20261019070000_marketing_os_meta_readonly.sql"),
  "utf8",
);

describe("Marketing OS Meta read-only credential migration", () => {
  it("keeps credential material service-role only", () => {
    assert.match(sql, /marketing_channel_credentials ENABLE ROW LEVEL SECURITY/i);
    assert.match(sql, /REVOKE ALL ON TABLE public\.marketing_channel_credentials FROM anon, authenticated/i);
    assert.doesNotMatch(sql, /CREATE POLICY .*marketing_channel_credentials/i);
  });

  it("uses encrypted columns and does not add plaintext access or refresh token columns", () => {
    assert.match(sql, /ciphertext TEXT NOT NULL/i);
    assert.match(sql, /auth_tag TEXT NOT NULL/i);
    assert.match(sql, /aes-256-gcm/i);
    assert.doesNotMatch(sql, /access_token\s+TEXT/i);
    assert.doesNotMatch(sql, /refresh_token\s+TEXT/i);
  });

  it("binds credentials to the same organization as their connection", () => {
    assert.match(sql, /FOREIGN KEY \(connection_id, organization_id\)/i);
    assert.match(sql, /REFERENCES public\.channel_connections\(id, organization_id\)/i);
  });
});
