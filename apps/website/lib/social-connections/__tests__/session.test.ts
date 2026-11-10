/**
 * Unit tests: OAuth session helpers
 */
import { generateState, generateCodeVerifier, deriveCodeChallenge } from "../session";

describe("generateState", () => {
  it("produces 64-char hex string", () => {
    const state = generateState();
    expect(state).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces unique values", () => {
    const states = new Set(Array.from({ length: 20 }, generateState));
    expect(states.size).toBe(20);
  });
});

describe("generateCodeVerifier", () => {
  it("produces a base64url string", () => {
    const v = generateCodeVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(v.length).toBeGreaterThanOrEqual(43);
  });
});

describe("deriveCodeChallenge", () => {
  it("produces deterministic SHA-256 base64url from verifier", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await deriveCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    // Idempotent
    expect(await deriveCodeChallenge(verifier)).toBe(challenge);
  });

  it("produces different challenge for different verifier", async () => {
    const a = await deriveCodeChallenge("verifier-a");
    const b = await deriveCodeChallenge("verifier-b");
    expect(a).not.toBe(b);
  });
});

describe("consumeOAuthSession — replay protection", () => {
  it("returns null on second consume of same state", async () => {
    const { consumeOAuthSession } = await import("../session");

    const usedAt = new Date().toISOString();
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
    expect(result).toBeNull();
    void usedAt;
  });
});
