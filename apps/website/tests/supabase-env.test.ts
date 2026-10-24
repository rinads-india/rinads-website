import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWebsiteSupabasePublicKey } from "../lib/supabase/env";

describe("resolveWebsiteSupabasePublicKey", () => {
  it("prefers the modern publishable key", () => {
    assert.equal(
      resolveWebsiteSupabasePublicKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_modern",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon",
      }),
      "sb_publishable_modern"
    );
  });

  it("falls back to the legacy anon key during migration", () => {
    assert.equal(
      resolveWebsiteSupabasePublicKey({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon",
      }),
      "legacy-anon"
    );
  });

  it("returns empty when neither public key is configured", () => {
    assert.equal(resolveWebsiteSupabasePublicKey({}), "");
  });
});
