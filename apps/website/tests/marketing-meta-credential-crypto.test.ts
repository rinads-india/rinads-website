import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
} from "../lib/marketing/meta-credential-crypto";

describe("Marketing credential encryption", () => {
  it("round-trips AES-256-GCM credentials without plaintext persistence", () => {
    const key = randomBytes(32).toString("base64");
    const plaintext = "meta-access-token-secret";
    const aad = "rinads:marketing:org-1:conn-1:meta:v1";
    const encrypted = encryptCredentialSecret(plaintext, key, aad);
    assert.equal(encrypted.algorithm, "aes-256-gcm");
    assert.equal(encrypted.ciphertext.includes(plaintext), false);
    assert.equal(decryptCredentialSecret(encrypted, key, aad), plaintext);
  });

  it("fails closed if credential rows are moved across tenant/connection AAD", () => {
    const key = randomBytes(32).toString("base64");
    const encrypted = encryptCredentialSecret("token", key, "org-1:conn-1");
    assert.throws(
      () => decryptCredentialSecret(encrypted, key, "org-2:conn-1"),
      /Unable to decrypt marketing credential/,
    );
  });
});
