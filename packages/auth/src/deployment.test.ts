import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PRODUCTION_PORTAL_ORIGINS, AUTH_COOKIE_DOMAIN, CANONICAL_AUTH_ORIGIN } from "./index";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("internal portal deployment configs", () => {
  it("pins vercel.json filters and docs to the confirmed domains", () => {
    const platform = JSON.parse(read("apps/platform-admin/vercel.json")) as {
      installCommand: string;
      buildCommand: string;
    };
    const owner = JSON.parse(read("apps/owner-portal/vercel.json")) as {
      installCommand: string;
      buildCommand: string;
    };
    const customer = JSON.parse(read("apps/customer-portal/vercel.json")) as {
      installCommand: string;
      buildCommand: string;
    };
    assert.match(platform.installCommand, /@rinads\/platform-admin/);
    assert.match(platform.buildCommand, /@rinads\/platform-admin build/);
    assert.match(owner.installCommand, /@rinads\/owner-portal/);
    assert.match(customer.installCommand, /@rinads\/customer-portal/);

    const docs = read("docs/deployment/VERCEL_INTERNAL_PORTALS.md");
    assert.match(docs, /https:\/\/admin\.rinads\.com/);
    assert.match(docs, /https:\/\/app\.rinads\.com/);
    assert.match(docs, /https:\/\/customers\.rinads\.com/);
    assert.match(docs, /https:\/\/glow\.rinads\.com/);
    assert.match(docs, /https:\/\/www\.rinads\.com/);
    assert.match(docs, /rinads\.india@gmail\.com/);
    assert.match(docs, /\.rinads\.com/);
    assert.match(docs, /pnpm admin:bootstrap-founder/);
    assert.match(docs, /\/api\/health/);
    assert.match(docs, /as live production owner\/customer data/);
    assert.equal(PRODUCTION_PORTAL_ORIGINS.platform, "https://admin.rinads.com");
    assert.equal(PRODUCTION_PORTAL_ORIGINS.owner, "https://app.rinads.com");
    assert.equal(PRODUCTION_PORTAL_ORIGINS.customer, "https://customers.rinads.com");
    assert.equal(PRODUCTION_PORTAL_ORIGINS.glow, "https://glow.rinads.com");
    assert.equal(CANONICAL_AUTH_ORIGIN, "https://www.rinads.com");
    assert.equal(AUTH_COOKIE_DOMAIN, ".rinads.com");
  });

  it("wires founder bootstrap as a root package command", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    assert.equal(
      pkg.scripts["admin:bootstrap-founder"],
      "pnpm exec tsx scripts/admin/bootstrap-founder.ts"
    );
  });
});
