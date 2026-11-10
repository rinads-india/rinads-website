/**
 * Unit tests: AES-256-GCM token encryption
 */
import { encryptTokenSet, decryptTokenSet } from "../crypto";
import type { OAuthTokenSet } from "../types";

const MOCK_SECRET = "a".repeat(64); // 32-byte key as 64-hex chars

const mockToken: OAuthTokenSet = {
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresAt: new Date("2027-01-01T00:00:00Z"),
  grantedScopes: ["pages_show_list"],
  tokenType: "bearer",
};

describe("encryptTokenSet / decryptTokenSet", () => {
  beforeEach(() => {
    process.env.SOCIAL_TOKENS_SECRET = MOCK_SECRET;
  });

  afterEach(() => {
    delete process.env.SOCIAL_TOKENS_SECRET;
    delete process.env.SOCIAL_TOKENS_SECRET_PREV;
  });

  it("round-trips a token set", async () => {
    const encrypted = await encryptTokenSet(mockToken);
    expect(encrypted).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    const decrypted = await decryptTokenSet(encrypted);
    expect(decrypted.accessToken).toBe(mockToken.accessToken);
    expect(decrypted.refreshToken).toBe(mockToken.refreshToken);
    expect(decrypted.grantedScopes).toEqual(mockToken.grantedScopes);
  });

  it("produces different ciphertext on each call (random IV)", async () => {
    const enc1 = await encryptTokenSet(mockToken);
    const enc2 = await encryptTokenSet(mockToken);
    expect(enc1).not.toBe(enc2);
  });

  it("throws on tampered ciphertext", async () => {
    const encrypted = await encryptTokenSet(mockToken);
    const parts = encrypted.split(".");
    parts[1] = parts[1]!.slice(0, -2) + "AA"; // tamper
    await expect(decryptTokenSet(parts.join("."))).rejects.toThrow();
  });

  it("throws when secret is missing", async () => {
    delete process.env.SOCIAL_TOKENS_SECRET;
    await expect(encryptTokenSet(mockToken)).rejects.toThrow();
  });
});
