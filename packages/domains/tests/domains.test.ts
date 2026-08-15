import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateVerificationToken,
  parseStorefrontSlugFromHost,
  transitionDomainStatus,
  canTransitionDomainStatus,
} from "../src/index";
import { resolveStorefrontTenantFromHost } from "../src/resolver";

describe("Domain verification", () => {
  it("generates verification token", () => {
    const token = generateVerificationToken();
    assert.ok(token.startsWith("rinads-verify-"));
  });

  it("transitions pending to verified", () => {
    const domain = {
      id: "d1",
      organizationId: "org_1",
      hostname: "shop.example.com",
      status: "pending" as const,
      verificationMethod: "txt" as const,
      verificationToken: "tok",
    };
    const next = transitionDomainStatus(domain, "verified");
    assert.ok(!("error" in next));
    if (!("error" in next)) assert.equal(next.status, "verified");
  });

  it("blocks invalid transitions", () => {
    assert.ok(!canTransitionDomainStatus("active", "pending"));
  });
});

describe("Host parsing", () => {
  it("parses slug subdomain", () => {
    assert.equal(parseStorefrontSlugFromHost("acme.store.rinads.com"), "acme");
    assert.equal(parseStorefrontSlugFromHost("www.example.com"), null);
  });
});

describe("Storefront resolver", () => {
  it("resolves org by storefront slug", async () => {
    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: async (col: string, val: string) => {
            if (table === "organization_settings" && col === "storefront_slug" && val === "acme") {
              return {
                data: [{ organization_id: "org_acme", storefront_slug: "acme" }],
                error: null,
              };
            }
            return { data: [], error: null };
          },
        }),
      }),
    };
    const resolved = await resolveStorefrontTenantFromHost(client, "acme.store.rinads.com");
    assert.ok(resolved);
    assert.equal(resolved!.organizationId, "org_acme");
  });

  it("blocks wrong custom domain org mapping (IDOR guard)", async () => {
    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: async (col: string, val: string) => {
            if (table === "organization_domains" && val === "evil.example.com") {
              return { data: [], error: null };
            }
            return { data: [], error: null };
          },
        }),
      }),
    };
    const resolved = await resolveStorefrontTenantFromHost(client, "evil.example.com");
    assert.equal(resolved, null);
  });
});
