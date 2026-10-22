import { createHmac, timingSafeEqual } from "node:crypto";

type WixSignedInstance = {
  instanceId: string;
  permissions?: string;
  uid?: string;
  siteOwnerId?: string;
  loginAccountId?: string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function parseSignedWixInstance(
  signedInstance: string,
  appSecret: string,
): WixSignedInstance | null {
  if (!signedInstance || !appSecret) return null;

  const [encodedSignature, encodedPayload, ...rest] = signedInstance.split(".");
  if (!encodedSignature || !encodedPayload || rest.length > 0) return null;

  try {
    const actual = decodeBase64Url(encodedSignature);
    const expected = createHmac("sha256", appSecret).update(encodedPayload).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    const parsed = JSON.parse(decodeBase64Url(encodedPayload).toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    const instance = parsed as Record<string, unknown>;
    if (typeof instance.instanceId !== "string" || !instance.instanceId) return null;

    return instance as WixSignedInstance;
  } catch {
    return null;
  }
}
