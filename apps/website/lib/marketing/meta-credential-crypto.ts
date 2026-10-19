import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedCredential = {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: "aes-256-gcm";
};

export function parseCredentialEncryptionKey(raw: string): Buffer {
  const value = raw.trim();
  const key = /^[0-9a-f]{64}$/i.test(value)
    ? Buffer.from(value, "hex")
    : Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("Marketing credential encryption key must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptCredentialSecret(
  plaintext: string,
  rawKey: string,
  additionalAuthenticatedData: string,
): EncryptedCredential {
  const key = parseCredentialEncryptionKey(rawKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(additionalAuthenticatedData, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    algorithm: "aes-256-gcm",
  };
}

export function decryptCredentialSecret(
  encrypted: EncryptedCredential,
  rawKey: string,
  additionalAuthenticatedData: string,
): string {
  try {
    const key = parseCredentialEncryptionKey(rawKey);
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));
    decipher.setAAD(Buffer.from(additionalAuthenticatedData, "utf8"));
    decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    throw new Error("Unable to decrypt marketing credential");
  }
}
