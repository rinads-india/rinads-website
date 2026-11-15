/**
 * Unit tests: AES-256-GCM token encryption (node:test).
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { encryptTokenSet, decryptTokenSet } from "../crypto";
import type { OAuthTokenSet } from "../types";

const MOCK_SECRET = "a".repeat(64);
const mockToken: OAuthTokenSet = {
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresAt: new Date("2027-01-01T00:00:00Z"),
  grantedScopes: ["pages_show_list"],
  tokenType: "bearer",
};

describe("encryptTokenSet / decryptTokenSet", () => {
  beforeEach(() => { process.env.SOCIAL_TOKENS_SECRET = MOCK_SECRET; });
  afterEach(() => {
    delete process.env.SOCIAL_TOKENS_SECRET;
    delete process.env.SOCIAL_TOKENS_SECRET_PREV;
  });

  it("round-trips a token set", async () => {
    const encrypted = await encryptTokenSet(mockToken);
    assert.match(encrypted.iv, /^[A-Za-z0-9_-]+$/);
    assert.match(encrypted.ciphertext, /^[A-Za-z0-9_-]+$/);
    assert.match(encrypted.tag, /^[A-Za-z0-9_-]+$/);
    const decrypted = await decryptTokenSet(encrypted.ciphertext, encrypted.iv, encrypted.tag, encrypted.keyVersion);
    assert.equal(decrypted.accessToken, mockToken.accessToken);
    assert.equal(decrypted.refreshToken, mockToken.refreshToken);
    assert.deepEqual(decrypted.grantedScopes, mockToken.grantedScopes);
  });

  it("uses a distinct IV for each encryption", async () => {
    const first = await encryptTokenSet(mockToken);
    const second = await encryptTokenSet(mockToken);
    assert.notEqual(first.iv, second.iv);
  });

  it("rejects tampered ciphertext", async () => {
    const encrypted = await encryptTokenSet(mockToken);
    const altered = encrypted.ciphertext.slice(0, -2) + (encrypted.ciphertext.endsWith("AA") ? "BB" : "AA");
    await assert.rejects(() => decryptTokenSet(altered, encrypted.iv, encrypted.tag, encrypted.keyVersion));
  });

  it("rejects missing secret", async () => {
    delete process.env.SOCIAL_TOKENS_SECRET;
    await assert.rejects(() => encryptTokenSet(mockToken));
  });
});
