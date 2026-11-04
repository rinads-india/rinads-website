import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20261019080000_marketing_os_governed_publishing.sql"),
  "utf8",
);

describe("Marketing OS governed publishing migration", () => {
  it("reuses canonical Runtime approvals instead of creating a parallel approval table", () => {
    assert.match(sql, /ALTER TABLE public\.runtime_approvals/i);
    assert.match(sql, /action_key = 'marketing\.publication\.publish'/i);
    assert.doesNotMatch(sql, /CREATE TABLE .*marketing.*approvals/i);
  });

  it("removes direct authenticated execution-state updates", () => {
    assert.match(sql, /REVOKE UPDATE ON TABLE public\.marketing_publications FROM authenticated/i);
    assert.match(sql, /GRANT UPDATE \(variant_id, channel_account_id, metadata\)/i);
    assert.match(sql, /status = 'DRAFT'/i);
  });

  it("claims approved work with a concurrent-safe row lease", () => {
    assert.match(sql, /claim_marketing_publications/i);
    assert.match(sql, /ra\.status = 'approved'/i);
    assert.match(sql, /FOR UPDATE OF p SKIP LOCKED/i);
    assert.match(sql, /marketing_publication_payload_hash/i);
  });

  it("keeps worker mutation RPCs service-role only", () => {
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.claim_marketing_publications\(INTEGER\) TO service_role/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.begin_marketing_publication_dispatch\(UUID, UUID\) TO service_role/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.complete_marketing_publication_dispatch/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.fail_marketing_publication_dispatch/i);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.claim_marketing_publications\(INTEGER\) FROM PUBLIC, anon, authenticated/i);
  });

  it("uses two-phase dispatch and quarantines ambiguous outcomes", () => {
    assert.match(sql, /dispatch_started_at/i);
    assert.match(sql, /delivery_state IN \('not_started', 'sent', 'unknown'\)/i);
    assert.match(sql, /PARTIAL_FAILURE/i);
    assert.match(sql, /manual reconciliation required/i);
    assert.match(sql, /stale_before_dispatch/i);
    assert.match(sql, /stale_after_dispatch/i);
  });

  it("invalidates approval when approved creative or target data changes", () => {
    assert.match(sql, /marketing_content_items_invalidate_publication_approval/i);
    assert.match(sql, /marketing_content_variants_invalidate_publication_approval/i);
    assert.match(sql, /marketing_media_assets_invalidate_publication_approval/i);
    assert.match(sql, /marketing_publication_authoring_invalidate_approval/i);
    assert.match(sql, /payload_hash_mismatch/i);
  });

  it("contains no provider credential material or provider HTTP calls", () => {
    assert.doesNotMatch(sql, /access_token/i);
    assert.doesNotMatch(sql, /refresh_token/i);
    assert.doesNotMatch(sql, /graph\.facebook\.com/i);
  });
});
