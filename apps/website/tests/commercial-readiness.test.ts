/**
 * Commercial-readiness quality gate for the public website.
 * Fails the build when SEO, claim, or placeholder regressions appear.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import {
  buildBreadcrumbListJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "../lib/json-ld";
import { PRODUCT_STATUS_META, PRODUCT_STATUS_VALUES } from "../lib/product-status";
import { NAV_GROUPS } from "../lib/product-ia";
import { getIndexableRoutes, getRouteDefinition, ROUTE_REGISTRY } from "../lib/route-registry";

const WEBSITE_ROOT = join(process.cwd());
const APP_ROOT = join(WEBSITE_ROOT, "app");
const COMPONENTS_ROOT = join(WEBSITE_ROOT, "components");

const AUTH_OR_APP_PREFIXES = [
  "/os",
  "/signup",
  "/onboarding",
  "/services/checkout",
  "/track",
  "/rinaglow",
  "/story-concept",
  "/api",
];

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

/** Map registry path → app page.tsx if it exists (dynamic segments ignored). */
function pageFileForPath(path: string): string | null {
  const segments = path === "/" ? [] : path.split("/").filter(Boolean);
  if (segments.some((s) => s.startsWith("[") && s.endsWith("]"))) return null;
  const file = join(APP_ROOT, ...segments, "page.tsx");
  return existsSync(file) ? file : null;
}

function extractInternalHrefs(source: string): string[] {
  const hrefs: string[] = [];
  const re = /href=\{?["'`](\/[^"'`?#]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

function knownPathsAndRedirects(): Set<string> {
  const known = new Set<string>(ROUTE_REGISTRY.map((r) => r.path));
  const config = readFileSync(join(WEBSITE_ROOT, "next.config.ts"), "utf8");
  const destRe = /destination:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = destRe.exec(config))) {
    const dest = m[1].split("?")[0];
    if (dest.startsWith("/")) known.add(dest);
  }

  // Any concrete page.tsx under app/ is a valid destination (covers academy/services leaves).
  for (const file of walk(APP_ROOT)) {
    if (!file.endsWith(`${join("", "page.tsx")}`) && !file.endsWith("/page.tsx")) continue;
    const rel = relative(APP_ROOT, file).replace(/\\/g, "/");
    if (!rel.endsWith("/page.tsx") && rel !== "page.tsx") continue;
    const dir = rel === "page.tsx" ? "" : rel.slice(0, -"/page.tsx".length);
    if (dir.includes("[")) continue;
    known.add(dir ? `/${dir}` : "/");
  }

  known.add("/contact");
  known.add("/projects");
  return known;
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
    const roots = [APP_ROOT, COMPONENTS_ROOT, join(WEBSITE_ROOT, "lib")];
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

  it("sitemap module includes every indexable registry path and excludes auth prefixes", () => {
    const sitemapSrc = readFileSync(join(APP_ROOT, "sitemap.ts"), "utf8");
    assert.match(sitemapSrc, /getIndexableRoutes/);
    for (const prefix of AUTH_OR_APP_PREFIXES) {
      assert.ok(
        sitemapSrc.includes(`"${prefix}"`) || sitemapSrc.includes(`'${prefix}'`),
        `sitemap must exclude prefix ${prefix}`,
      );
    }
    // Indexable paths are merged from registry — verify no auth path is indexable.
    for (const route of getIndexableRoutes()) {
      assert.ok(
        !AUTH_OR_APP_PREFIXES.some(
          (prefix) => route.path === prefix || route.path.startsWith(`${prefix}/`),
        ),
        `indexable route collides with auth/app prefix: ${route.path}`,
      );
    }
  });

  it("requires H1 / PageHero headline for registry pages that have page.tsx", () => {
    const missing: string[] = [];
    for (const route of getIndexableRoutes()) {
      const file = pageFileForPath(route.path);
      if (!file) continue;
      const text = readFileSync(file, "utf8");
      // page.tsx may delegate to *Client — also scan sibling client if present
      const sources = [text];
      const dir = join(file, "..");
      for (const entry of readdirSync(dir)) {
        if (/Client\.tsx$/.test(entry)) {
          sources.push(readFileSync(join(dir, entry), "utf8"));
        }
      }
      const blob = sources.join("\n");
      const hasH1 =
        /<h1[\s>]/.test(blob) ||
        /headline=/.test(blob) ||
        /PageHero/.test(blob) ||
        /HomeHero/.test(blob) ||
        /LegalPage/.test(blob) ||
        /OsMarketingPage/.test(blob) ||
        /VerticalSolutionPage/.test(blob) ||
        /AcademyProgramPage/.test(blob) ||
        /ServiceLinePage/.test(blob) ||
        /HomeClient|PlatformClient|SolutionsClient|RinpoClient|PricingClient/.test(blob);
      if (!hasH1) missing.push(`${route.path} (${relative(WEBSITE_ROOT, file)})`);
    }
    assert.deepEqual(missing, [], `Missing H1 contract:\n${missing.join("\n")}`);
  });

  it("crawls marketing nav hrefs against known routes and redirects", () => {
    const known = knownPathsAndRedirects();
    const unknown: string[] = [];
    for (const group of NAV_GROUPS) {
      if (group.href && !known.has(group.href.split("?")[0])) {
        unknown.push(`nav group ${group.label}: ${group.href}`);
      }
      for (const item of group.items) {
        const path = item.href.split("?")[0];
        if (!known.has(path)) unknown.push(`nav item ${item.label}: ${item.href}`);
      }
    }
    assert.deepEqual(unknown, [], unknown.join("\n"));
  });

  it("parses JSON-LD helpers for home and pricing without throwing", () => {
    const home = [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      buildWebPageJsonLd({
        path: "/",
        title: "RINADS",
        description: "AI operating platform",
      }),
      buildSoftwareApplicationJsonLd(),
    ];
    const pricing = [
      buildWebPageJsonLd({
        path: "/pricing",
        title: "Pricing | RINADS",
        description: "Plans",
      }),
      buildBreadcrumbListJsonLd([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ]),
    ];
    for (const graph of [home, pricing]) {
      const raw = serializeJsonLd(graph);
      const parsed = JSON.parse(raw) as Array<{ "@type": string }>;
      assert.ok(Array.isArray(parsed));
      assert.ok(parsed.every((node) => typeof node["@type"] === "string"));
    }
    // Never invent JobPosting / Course openings in helpers module
    const helpers = readFileSync(join(WEBSITE_ROOT, "lib/json-ld.ts"), "utf8");
    assert.doesNotMatch(helpers, /JobPosting/);
    assert.doesNotMatch(helpers, /"@type":\s*"Course"/);
  });

  it("keeps LeadForm a11y contracts: visible labels and role=alert errors", () => {
    const src = readFileSync(join(COMPONENTS_ROOT, "system/LeadForm.tsx"), "utf8");
    assert.match(src, /htmlFor=/);
    assert.match(src, /role="alert"/);
    assert.match(src, /aria-labelledby=/);
    assert.match(src, /privacyAccepted/);
  });

  it("keeps ProductStatus accessible names for all approved states", () => {
    const src = readFileSync(join(COMPONENTS_ROOT, "system/ProductStatus.tsx"), "utf8");
    assert.match(src, /aria-label=\{`Availability:/);
    for (const value of PRODUCT_STATUS_VALUES) {
      assert.ok(PRODUCT_STATUS_META[value].label.trim());
      assert.ok(PRODUCT_STATUS_META[value].description.trim());
    }
  });

  it("does not reintroduce Three.js / Rinpo3D on the marketing site", () => {
    const pkg = JSON.parse(readFileSync(join(WEBSITE_ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    assert.equal(pkg.dependencies?.three, undefined);
    assert.equal(pkg.dependencies?.["@react-three/fiber"], undefined);
    assert.equal(pkg.dependencies?.["@react-three/drei"], undefined);
    for (const file of walk(join(WEBSITE_ROOT, "components"))) {
      const text = readFileSync(file, "utf8");
      assert.doesNotMatch(text, /from ["']three["']/);
      assert.doesNotMatch(text, /@react-three/);
      assert.doesNotMatch(text, /Rinpo3D/);
    }
  });

  it("lazy-loads RINPO character / phone islands", () => {
    const src = readFileSync(join(COMPONENTS_ROOT, "rinpo/RinpoProvider.tsx"), "utf8");
    assert.match(src, /dynamic\(/);
    assert.match(src, /RinpoCharacter/);
    assert.match(src, /RinpoPhone/);
  });

  it("documents optional GTM and lead persistence env contracts", () => {
    const analytics = readFileSync(join(COMPONENTS_ROOT, "system/AnalyticsProvider.tsx"), "utf8");
    assert.match(analytics, /NEXT_PUBLIC_GTM_ID/);
    const leads = readFileSync(join(APP_ROOT, "api/leads/route.ts"), "utf8");
    assert.match(leads, /LEAD_WEBHOOK_URL/);
    assert.match(leads, /site_leads/);
    assert.match(leads, /createServiceRoleClient/);
    const migration = readFileSync(
      join(WEBSITE_ROOT, "../../supabase/migrations/20260924100000_site_leads.sql"),
      "utf8",
    );
    assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.site_leads/);
    assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  });
});
