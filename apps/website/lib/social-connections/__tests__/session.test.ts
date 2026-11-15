/**
 * Unit tests: OAuth session helpers
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateState, generateCodeVerifier, deriveCodeChallenge } from "../session";

describe("generateState", () => {
  it("produces 64-char hex string", () => {
    const state = generateState();
    assert.match(state, /^[0-9a-f]{64}$/);
  });

  it("produces unique values", () => {
    const states = new Set(Array.from({ length: 20 }, generateState));
    assert.equal(states.size, 20);
  });
});

describe("generateCodeVerifier", () => {
  it("produces a base64url string", () => {
    const v = generateCodeVerifier();
    assert.match(v, /^[A-Za-z0-9_-]+$/);
    assert.ok(v.length >= 43);
  });
});

describe("deriveCodeChallenge", () => {
  it("produces deterministic SHA-256 base64url from verifier", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await deriveCodeChallenge(verifier);
    assert.match(challenge, /^[A-Za-z0-9_-]+$/);
    // Idempotent
    assert.equal(await deriveCodeChallenge(verifier), challenge);
  });

  it("produces different challenge for different verifier", async () => {
    const a = await deriveCodeChallenge("verifier-a");
    const b = await deriveCodeChallenge("verifier-b");
    assert.notEqual(a, b);
  });
});

describe("consumeOAuthSession — replay protection", () => {
  it("returns null on second consume of same state", async () => {
    const { consumeOAuthSession } = await import("../session");

    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            is: () => ({
              gt: () => ({
                single: async () => ({
                  data: null,
                  error: { message: "No matching row" },
                }),
              }),
            }),
          }),
        }),
        update: () => ({ eq: () => ({ eq: () => ({}) }) }),
      }),
    };

    const result = await consumeOAuthSession(mockSupabase as never, "already-used-state");
    assert.equal(result, null);
  });
});
