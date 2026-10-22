import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { branchHref } from "../components/BranchSwitcher";

const root = process.cwd();

describe("R GLOW dashboard parity", () => {
  it("renders the Today v2 command center from governed salon intelligence", () => {
    const page = readFileSync(join(root, "app/(console)/dashboard/page.tsx"), "utf8");
    assert.match(page, /Today · live operations/);
    assert.match(page, /rinpo-brief/);
    assert.match(page, /rinpo-face\.png/);
    assert.match(page, /RINPO daily brief/);
    assert.match(page, /Front desk now/);
    assert.match(page, /Chair & queue pulse/);
    assert.match(page, /Money & growth/);
    assert.match(page, /Open opportunities/);
    assert.match(page, /Revenue today/);
    assert.match(page, /Collected/);
    assert.match(page, /Open loops/);
    assert.match(page, /Today&rsquo;s schedule/);
    assert.match(page, /Staff today/);
    assert.match(page, /RINADS Intelligence/);
    assert.match(page, /What needs attention/);
    assert.match(page, /Low-rating follow-up/);
    assert.match(page, /RINPO approvals/);
    assert.match(page, /EmptyState/);
    assert.match(page, /getBusinessSummary\(repo, tenancy.organizationId, \{ branchId:/);
    assert.doesNotMatch(page, /demoContext|USE_DEMO_STORE|Ringlow/);
  });

  it("keeps the store switcher in the console nav and preserves branch on links", () => {
    const nav = readFileSync(join(root, "components/RinaglowNav.tsx"), "utf8");
    assert.match(nav, /BranchSwitcher/);
    assert.equal(branchHref("/calendar", "branch_1"), "/calendar?branch=branch_1");
    assert.equal(branchHref("/calendar?view=week", "branch_1"), "/calendar?view=week&branch=branch_1");
    assert.equal(branchHref("/dashboard", null), "/dashboard");
  });
});
