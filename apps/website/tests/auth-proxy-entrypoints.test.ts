import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const NEXT16_APPS = [
  "website",
  "owner-portal",
  "customer-portal",
  "platform-admin",
  "rinaglow",
  "storefront",
] as const;

describe("Next.js 16 Supabase auth entry points", () => {
  for (const app of NEXT16_APPS) {
    it(`${app} has exactly the supported proxy.ts entry point`, () => {
      const proxyPath = fileURLToPath(new URL(`../../${app}/proxy.ts`, import.meta.url));
      const legacyPath = fileURLToPath(new URL(`../../${app}/middleware.ts`, import.meta.url));

      assert.equal(existsSync(proxyPath), true, `${app}: proxy.ts is required`);
      assert.equal(existsSync(legacyPath), false, `${app}: remove deprecated middleware.ts`);

      const source = readFileSync(proxyPath, "utf8");
      assert.match(source, /export async function proxy\(/);
      assert.match(source, /checkProductionEnvContract\(/);
      assert.match(source, /getClaims\(|getVerifiedSupabaseIdentity\(/);
    });
  }
});
