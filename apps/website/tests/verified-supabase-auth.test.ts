import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getVerifiedSupabaseIdentity } from "../lib/supabase/verified-auth";

describe("getVerifiedSupabaseIdentity", () => {
  it("prefers getClaims when the SDK exposes it", async () => {
    let getUserCalled = false;
    const identity = await getVerifiedSupabaseIdentity({
      auth: {
        async getClaims() {
          return { data: { claims: { sub: "user-claims" } }, error: null };
        },
        async getUser() {
          getUserCalled = true;
          return { data: { user: { id: "user-network" } }, error: null };
        },
      },
    });

    assert.deepEqual(identity, { userId: "user-claims", verification: "claims" });
    assert.equal(getUserCalled, false);
  });

  it("fails closed when getClaims exists but rejects the token", async () => {
    let getUserCalled = false;
    const identity = await getVerifiedSupabaseIdentity({
      auth: {
        async getClaims() {
          return { data: null, error: { message: "invalid jwt" } };
        },
        async getUser() {
          getUserCalled = true;
          return { data: { user: { id: "should-not-fallback" } }, error: null };
        },
      },
    });

    assert.equal(identity, null);
    assert.equal(getUserCalled, false);
  });

  it("uses getUser as the secure compatibility path for older SDKs", async () => {
    const identity = await getVerifiedSupabaseIdentity({
      auth: {
        async getUser() {
          return { data: { user: { id: "legacy-user" } }, error: null };
        },
      },
    });

    assert.deepEqual(identity, { userId: "legacy-user", verification: "user" });
  });

  it("rejects missing or malformed user identifiers", async () => {
    const identity = await getVerifiedSupabaseIdentity({
      auth: {
        async getUser() {
          return { data: { user: { id: null } }, error: null };
        },
      },
    });

    assert.equal(identity, null);
  });
});
