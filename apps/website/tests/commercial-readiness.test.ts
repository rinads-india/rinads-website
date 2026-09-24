/**
 * Commercial-readiness quality gate for the public website.
 * Fails the build when SEO, claim, or placeholder regressions appear.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getIndexableRoutes, getRouteDefinition, ROUTE_REGISTRY } from "../lib/route-registry";

const WEBSITE_ROOT = join(process.cwd());
const APP_ROOT = join(WEBSITE_ROOT, "app");

const PROHIBITED = [
  /world'?s first/i,
  /synthetic customer/i,
  /the public experience should/i,
  /product surfaces present in the RINADS codebase/i,
  /platform repository already separates/i,
  /current repository does not contain/i,
  /current repository boundary/i,
  /SOC 2 compliant/i,
  /ISO 27001 certified/i,
  /HIPAA compliant/i,
  /99\.9%\s*uptime/i,
  /Trusted by 2000\+ Enterprises/i,
  /All systems operational/i,
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts|html)$/.test(entry)) files.push(full);
  }
  return files;
}

describe("commercial readiness QA gate", () => {
  it("requires unique titles across indexable routes", () => {
    const titles = new Map<string, string>();
    for (const route of getIndexableRoutes()) {
      const existing = titles.get(route.title);
      assert.equal(
        existing,
        undefined,
        `Duplicate title "${route.title}" on ${route.path} and ${existing}`,
      );
      titles.set(route.title, route.path);
    }
  });

  it("requires every indexable route to have title, description, and canonical path", () => {
    for (const route of getIndexableRoutes()) {
      assert.ok(route.title.trim(), `Missing title: ${route.path}`);
      assert.ok(route.description.trim(), `Missing description: ${route.path}`);
      assert.ok(route.path.startsWith("/"), `Invalid path: ${route.path}`);
    }
  });

  it("keeps auth and app routes non-indexable", () => {
    for (const path of ["/os", "/signup", "/onboarding/create-organization", "/services/checkout", "/story-concept"]) {
      const route = getRouteDefinition(path);
      assert.ok(route, `Missing registry entry for ${path}`);
      assert.equal(route?.indexable, false, `${path} must not be indexable`);
    }
  });

  it("does not allow contact to be a non-destination", () => {
    const contact = getRouteDefinition("/contact");
    assert.equal(contact?.indexable, true);
    assert.equal(contact?.pageType, "form");
  });

  it("scans marketing sources for prohibited public claims and authoring copy", () => {
    const roots = [
      join(APP_ROOT),
      join(WEBSITE_ROOT, "components"),
      join(WEBSITE_ROOT, "lib"),
    ];
    const skipFragments = [
      `${join("public", "story-concept")}`,
      "commercial-readiness.test",
      "PHASE-0-AUDIT",
    ];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of walk(root)) {
        if (skipFragments.some((frag) => file.includes(frag))) continue;
        const text = readFileSync(file, "utf8");
        for (const pattern of PROHIBITED) {
          if (pattern.test(text)) {
            offenders.push(`${file} :: ${pattern}`);
          }
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join("\n"));
  });

  it("quarantines story-concept via redirect instead of serving concept HTML", () => {
    const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
    assert.match(config, /source:\s*"\/story-concept"/);
    assert.match(config, /destination:\s*"\/"/);
    assert.doesNotMatch(config, /story-concept\/index\.html/);
  });

  it("keeps registry size intentional", () => {
    assert.ok(ROUTE_REGISTRY.length > 40);
  });
});
