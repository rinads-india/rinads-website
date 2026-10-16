import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import { validateLeadPayload } from "../lib/content/leads";
import { getPublishedCaseStudies } from "../lib/content/case-studies";
import { getSolution } from "../lib/content/solutionCatalog";
import { getVertical } from "../lib/content/verticals";
import { getRouteDefinition } from "../lib/route-registry";
import { NAV_GROUPS } from "../lib/product-ia";
import { MARKETING_EVENTS } from "../lib/analytics";

describe("progressive lead validation", () => {
  it("accepts step1 with email or phone without company size", () => {
    const withEmail = validateLeadPayload({
      stage: "step1",
      outcome: "run-better",
      name: "Ada",
      workEmail: "ada@example.com",
      company: "Ada Co",
      role: "Owner",
      privacyAccepted: true,
    });
    assert.equal(withEmail.ok, true);
    assert.equal(withEmail.value?.stage, "step1");

    const withPhone = validateLeadPayload({
      stage: "step1",
      outcome: "automate",
      name: "Ben",
      workEmail: "",
      phone: "+91 98765 43210",
      company: "Ben Co",
      role: "Ops",
      privacyAccepted: true,
    });
    assert.equal(withPhone.ok, true);
    assert.ok(withPhone.value?.phone);
  });

  it("rejects step1 without contact channel or privacy", () => {
    const result = validateLeadPayload({
      stage: "step1",
      outcome: "run-better",
      name: "Ada",
      company: "Ada Co",
      role: "Owner",
      privacyAccepted: false,
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.field === "workEmail" || e.field === "phone"));
    assert.ok(result.errors.some((e) => e.field === "privacyAccepted"));
  });
});

describe("footer and dead destinations", () => {
  it("footer uses Meet RINPO period and config-gated socials", async () => {
    const footer = await readFile(new URL("../components/rinads/Footer.tsx", import.meta.url), "utf8");
    assert.match(footer, /Meet RINPO\./);
    assert.doesNotMatch(footer, /Meet RINPO\?/);
    assert.match(footer, /COMPANY_CONFIG\.socials/);
    assert.doesNotMatch(footer, /href:\s*"https:\/\/www\.rinads\.com"/);
  });

  it("surfaces customer evidence with honest empty states when no stories exist", async () => {
    assert.equal(getPublishedCaseStudies().length, 0);
    const customersNav = NAV_GROUPS.find((g) => g.label === "Customers");
    assert.ok(customersNav);
    assert.ok(customersNav!.items.some((item) => item.href.includes("#stories")));
    const customersPage = await readFile(
      new URL("../app/customers/page.tsx", import.meta.url),
      "utf8",
    );
    assert.match(customersPage, /EVIDENCE_EMPTY_STATES/);
    assert.match(customersPage, /CUSTOMER_EVIDENCE_SECTIONS/);
    assert.match(customersPage, /scroll-mt-28/);
    const resources = await readFile(
      new URL("../app/resources/ResourcesClient.tsx", import.meta.url),
      "utf8",
    );
    assert.match(resources, /business-readiness/);
    assert.match(resources, /getPublishedCaseStudies/);
    assert.match(resources, /hasStories/);
  });
});

describe("breadcrumbs and automotive", () => {
  it("OS and vertical templates render breadcrumbs via shell", async () => {
    const os = await readFile(
      new URL("../components/system/OsMarketingPage.tsx", import.meta.url),
      "utf8",
    );
    const vertical = await readFile(
      new URL("../components/system/VerticalSolutionPage.tsx", import.meta.url),
      "utf8",
    );
    const shell = await readFile(
      new URL("../components/system/MarketingPageShell.tsx", import.meta.url),
      "utf8",
    );
    assert.match(shell, /breadcrumbs/);
    assert.match(os, /breadcrumbs/);
    assert.match(vertical, /breadcrumbs/);
  });

  it("registers automotive coming-soon solution page", () => {
    const solution = getSolution("automotive");
    assert.ok(solution);
    assert.equal(solution!.href, "/solutions/automotive");
    assert.equal(solution!.status, "roadmap");
    assert.ok(getVertical("automotive"));
    assert.ok(getRouteDefinition("/solutions/automotive"));
  });
});

describe("analytics wiring", () => {
  it("declares service_project_started and projects page fires it", async () => {
    assert.ok((MARKETING_EVENTS as readonly string[]).includes("service_project_started"));
    const projects = await readFile(
      new URL("../app/projects/ProjectsClient.tsx", import.meta.url),
      "utf8",
    );
    assert.match(projects, /service_project_started/);
  });

  it("does not leave Book a platform demo on marketing surfaces", async () => {
    const { readdir } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const root = new URL("../", import.meta.url);
    const hits: string[] = [];

    async function walk(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (full.endsWith("/lib/ctas.ts")) continue;
        if (full.includes("/tests/")) continue;
        const text = await readFile(full, "utf8");
        if (/book a platform demo/i.test(text)) hits.push(full);
      }
    }

    await walk(root.pathname);
    assert.deepEqual(hits, []);
  });
});
