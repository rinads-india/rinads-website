import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import { OS_AREAS } from "@rinads/company-os";
import { getOsAreaNavGroups, getOsMobileMoreAreaItems } from "../lib/os-nav";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const founder = { roleKey: "founder", permissions: [] as string[] };
const staff = { roleKey: "staff", permissions: ["crm.read", "projects.read", "studio.read", "growth.read", "comms.read", "academy.read", "approvals.read"] };

describe("Company OS navigation", () => {
  it("shows all 21 areas to a founder and fewer to staff, never more than the permission model grants", () => {
    const all = getOsAreaNavGroups(founder).flatMap((g) => g.items);
    assert.equal(all.length, 21);
    assert.deepEqual(new Set(all.map((i) => i.id)), new Set(OS_AREAS.map((a) => a.id)));
    const staffIds = getOsAreaNavGroups(staff).flatMap((g) => g.items.map((i) => i.id));
    for (const hidden of ["founder", "finance", "engineering", "ai", "settings"]) assert.ok(!staffIds.includes(hidden), `${hidden} must be hidden for staff`);
    for (const shown of ["home", "customers", "work", "studio"]) assert.ok(staffIds.includes(shown), `${shown} should be visible to staff`);
  });

  it("the mobile More sheet never repeats the bottom-bar destinations", () => {
    const more = getOsMobileMoreAreaItems(founder).map((i) => i.id);
    for (const primary of ["home", "customers", "work", "growth"]) assert.ok(!more.includes(primary));
  });

  it("every area has a real page", () => {
    for (const area of OS_AREAS) {
      const path = area.href === "/os" ? "app/os/page.tsx" : `app${area.href}/page.tsx`;
      assert.ok(existsSync(join(root, path)), `${area.id} has no page at ${path}`);
    }
  });
});

describe("Company OS pages are gated and honest", () => {
  const pages = walk(join(root, "app/os")).filter((f) => f.endsWith("page.tsx"));
  const bridgeOnly = new Set(["app/os/page.tsx", "app/os/home/page.tsx", "app/os/automate/page.tsx", "app/os/money/page.tsx", "app/os/rooms/page.tsx", "app/os/work/calendar/page.tsx", "app/os/platforms/page.tsx", "app/os/work/teams/page.tsx"]);

  it("every data page resolves the session through guard() and never reads data directly", () => {
    for (const file of pages) {
      const rel = relative(root, file);
      if (bridgeOnly.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      assert.match(src, /guard\(/, `${rel} must call guard()`);
      assert.doesNotMatch(src, /createClient|supabase\.from|\.from\(["']/, `${rel} must not query the database directly`);
      assert.doesNotMatch(src, /"use client"/, `${rel} must be a server component`);
    }
  });

  it("pages never invent data: no hard-coded money, counts or Math.random", () => {
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      assert.doesNotMatch(src, /Math\.random|faker|lorem ipsum/i, relative(root, file));
      assert.doesNotMatch(src, /₹\s?\d{2,}/, `${relative(root, file)} must not hard-code a rupee figure`);
    }
  });

  it("client components never import the server package or the service role", () => {
    for (const file of walk(join(root, "components")).concat(walk(join(root, "app/os")))) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      const src = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(src)) continue;
      assert.doesNotMatch(src, /company-os-server/, `${relative(root, file)} is a client file importing server code`);
      assert.doesNotMatch(src, /SERVICE_ROLE/, relative(root, file));
    }
  });
});

describe("service-role containment", () => {
  it("the Company OS touches the service role in exactly one file, and only to read website leads", () => {
    const offenders: string[] = [];
    for (const dir of ["lib/company-os", "components/os/company", "app/os", "app/api/os"]) {
      for (const file of walk(join(root, dir))) {
        if (!/\.(tsx|ts)$/.test(file)) continue;
        if (/SERVICE_ROLE|service_role|createServiceRole/.test(readFileSync(file, "utf8"))) offenders.push(relative(root, file));
      }
    }
    assert.deepEqual(offenders, ["lib/company-os/site-leads.ts"]);
    const src = read("lib/company-os/site-leads.ts");
    assert.doesNotMatch(src, /\.(insert|update|delete|upsert|rpc)\(/, "site-lead access must stay read-only");
    assert.match(src, /import "server-only"/);
  });

  it("the company session and governed actions use only the caller's RLS-bound client", () => {
    for (const f of ["lib/company-os/session.ts", "lib/company-os/api-session.ts"]) {
      const src = read(f);
      assert.match(src, /createWebsiteServerClient/);
      assert.doesNotMatch(src, /SERVICE_ROLE/);
    }
  });
});

describe("RINPO company briefing endpoint", () => {
  const route = read("app/api/os/rinpo/route.ts");
  it("requires a session, is rate limited and tenant-scoped", () => {
    assert.match(route, /unauthenticated/);
    assert.match(route, /status: 401/);
    assert.match(route, /limiter\.check/);
    assert.match(route, /session\.ctx\.organizationId/);
  });
  it("is read-only and makes no model call", () => {
    assert.doesNotMatch(route, /\.insert\(|\.update\(|\.delete\(|\.rpc\(|runGovernedAction/);
    assert.doesNotMatch(route, /api\.openai|api\.x\.ai|anthropic|chat\/completions/i);
  });
  it("the dock only falls back to public chat when the company endpoint cannot answer", () => {
    const dock = read("components/os/OsRinpoDock.tsx");
    assert.match(dock, /\/api\/os\/rinpo/);
    assert.match(dock, /\/api\/chat/);
  });
});

describe("governed actions", () => {
  it("server actions are tenant-bound and idempotent", () => {
    const src = read("lib/company-os/actions.ts");
    assert.match(src, /^"use server"/);
    assert.match(src, /idempotencyKey/);
    assert.match(src, /getCompanyOsSession/);
    // The browser can name an action and an input; it can never name the organisation or the role.
    assert.doesNotMatch(src, /organizationId.*formData|formData.*organizationId/i);
  });
});
