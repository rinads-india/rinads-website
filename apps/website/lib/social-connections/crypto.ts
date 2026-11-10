/**
 * Token vault — AES-256-GCM encryption for provider OAuth tokens.
 * SERVER ONLY. Never import this from client components.
 *
 * Stored format: base64url(iv) + "." + base64url(ciphertext) + "." + base64url(tag)
 */

import type { OAuthTokenSet } from "./types";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const TAG_LENGTH = 128; // bits

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function base64url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64url");
}

function fromBase64url(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, "base64url"));
}

function getSecretKey(version: 1 | 2 = 1): Uint8Array {
  const envKey =
    version === 1 ? "SOCIAL_TOKENS_SECRET" : "SOCIAL_TOKENS_SECRET_PREV";
  const hex = process.env[envKey];
  if (!hex || hex.length !== 64) {
    throw new Error(
      `${envKey} must be a 64-character hex string (256-bit key). ` +
        "Generate with: openssl rand -hex 32"
    );
  }
  return hexToBytes(hex);
}

async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptTokenSet(
  tokenSet: OAuthTokenSet
): Promise<{ ciphertext: string; iv: string; tag: string; keyVersion: number }> {
  const keyBytes = getSecretKey(1);
  const cryptoKey = await importKey(keyBytes);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify(tokenSet));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    cryptoKey,
    plaintext
  );

  // AES-GCM: ciphertext is the first N-16 bytes; last 16 bytes are the GCM tag
  const encBuf = new Uint8Array(encrypted);
  const cipherBuf = encBuf.slice(0, encBuf.length - 16);
  const tagBuf = encBuf.slice(encBuf.length - 16);

  return {
    iv: base64url(iv),
    ciphertext: base64url(cipherBuf),
    tag: base64url(tagBuf),
    keyVersion: 1,
  };
}

export async function decryptTokenSet(
  ciphertext: string,
  iv: string,
  tag: string,
  keyVersion: number = 1
): Promise<OAuthTokenSet> {
  const keyBytes = getSecretKey(keyVersion === 1 ? 1 : 2);
  const cryptoKey = await importKey(keyBytes);

  const ivBytes = fromBase64url(iv);
  const cipherBytes = fromBase64url(ciphertext);
  const tagBytes = fromBase64url(tag);

  // Reconstruct combined AES-GCM buffer (ciphertext + tag)
  const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
  combined.set(cipherBytes);
  combined.set(tagBytes, cipherBytes.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes, tagLength: TAG_LENGTH },
    cryptoKey,
    combined
  );

  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as OAuthTokenSet;
}
