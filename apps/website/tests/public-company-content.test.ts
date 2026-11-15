/**
 * Public identity and narrative retirement regression checks.
 * Internal founder RBAC, legal records and archived planning docs are intentionally out of scope.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getRouteDefinition } from "../lib/route-registry";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");

describe("public founder and story retirement", () => {
  it("contains no public founder identity config, biography or RINPO exposure", () => {
    const company = source("lib/content/companyConfig.ts");
    const rinpoKnowledge = source("lib/rinpo-live/knowledge.ts");
    const rinpoPersonality = source("lib/rinpo-live/personality.ts");
    const companyDemo = readFileSync(join(root, "../../packages/company-os/src/demo-store.ts"), "utf8");
    for (const content of [company, rinpoKnowledge, rinpoPersonality, companyDemo]) {
      assert.doesNotMatch(content, /Andrino\s+T\s+D/i);
      assert.doesNotMatch(content, /Managing Director\s*&\s*CEO/i);
      assert.doesNotMatch(content, /I grew up inside small businesses/i);
    }
  });

  it("hides retired pages from the company navigation and sitemap", () => {
    const nav = source("lib/product-ia.ts");
    const config = source("next.config.ts");
    for (const path of ["/company/founder", "/company/story"]) {
      assert.ok(!nav.includes(`href: "${path}"`), path);
      assert.match(config, new RegExp(`source: "${path}"`));
      assert.equal(getRouteDefinition(path)?.indexable, false);
    }
    for (const path of ["/company/rinpo-story", "/rinpo/story"]) {
      assert.equal(getRouteDefinition(path)?.indexable, false);
    }
  });

  it("shows only operating roles and product CTAs in public demos", () => {
    const demoConfig = source("lib/os-demo-config.ts");
    const osDemo = source("components/system/OperatingSystemDemo.tsx");
    assert.doesNotMatch(demoConfig, /Founder Command Center/);
    assert.doesNotMatch(osDemo, /Founder Command Center/);
    assert.doesNotMatch(source("app/rinpo/RinpoClient.tsx"), /href="\/rinpo\/story"/);
  });
});
