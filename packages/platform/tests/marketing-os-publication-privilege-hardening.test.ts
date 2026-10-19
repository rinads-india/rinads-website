import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const sql = readFileSync(
  join(
    process.cwd(),
    "../../supabase/migrations/20261019080200_marketing_os_publication_privilege_hardening.sql",
  ),
  "utf8",
);

describe("Marketing OS publication privilege hardening", () => {
  it("revokes table-wide publication execution mutations", () => {
    assert.match(
      sql,
      /REVOKE UPDATE ON TABLE public\.marketing_publications FROM PUBLIC, anon, authenticated/i,
    );
    assert.match(
      sql,
      /REVOKE DELETE ON TABLE public\.marketing_publications FROM PUBLIC, anon, authenticated/i,
    );
    assert.match(
      sql,
      /REVOKE INSERT ON TABLE public\.marketing_publications FROM PUBLIC, anon/i,
    );
  });

  it("grants authenticated publishers authoring-only columns", () => {
    assert.match(
      sql,
      /GRANT UPDATE \(variant_id, channel_account_id, metadata\)[\s\S]*TO authenticated/i,
    );
    assert.doesNotMatch(sql, /GRANT UPDATE \(status/i);
    assert.doesNotMatch(sql, /GRANT UPDATE \(approval_id/i);
    assert.doesNotMatch(sql, /GRANT UPDATE \(external_post_id/i);
  });
});
