import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSupabaseAuthReady, resolveAuthConfig } from "./config";
import { mapSupabaseUser } from "./mappers";

describe("resolveAuthConfig", () => {
  it("defaults to demo", () => {
    const config = resolveAuthConfig({});
    assert.equal(config.provider, "demo");
    assert.equal(isSupabaseAuthReady(config), false);
  });

  it("requires url and anon key for supabase readiness", () => {
    const config = resolveAuthConfig({
      NEXT_PUBLIC_AUTH_PROVIDER: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    assert.equal(isSupabaseAuthReady(config), true);
  });
});

describe("mapSupabaseUser", () => {
  it("maps id and email", () => {
    const user = mapSupabaseUser({
      id: "u1",
      email: "a@b.c",
      user_metadata: { display_name: "Ada" },
    });
    assert.equal(user.id, "u1");
    assert.equal(user.displayName, "Ada");
  });
});
