import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  getCompanyOsDesktopNavItems,
  getCompanyOsMobilePrimaryNavItems,
  resolveCompanyOsActiveNavId,
} from "../lib/company-os-nav";
import { canAccessFounderTower, resolveCompanyOsMode } from "../lib/company-os-mode";
import { buildDemoRoleView } from "../lib/os-org-role";

const websiteRoot = process.cwd();

describe("company-os-nav", () => {
  it("exposes expected primary nav ids", () => {
    const desktop = getCompanyOsDesktopNavItems("admin");
    const ids = desktop.map((item) => item.id);
    assert.ok(ids.includes("home"));
    assert.ok(ids.includes("founder"));
    assert.ok(ids.includes("customers"));
    assert.ok(ids.includes("sales"));
    assert.ok(ids.includes("work"));
    assert.ok(ids.includes("approvals"));
  });

  it("mobile primary matches company shell", () => {
    const mobile = getCompanyOsMobilePrimaryNavItems();
    assert.deepEqual(
      mobile.map((item) => item.id),
      ["home", "customers", "work", "sales", "more"],
    );
  });

  it("resolves nested company routes", () => {
    assert.equal(resolveCompanyOsActiveNavId("/os/founder"), "founder");
    assert.equal(resolveCompanyOsActiveNavId("/os/customers/co-apex"), "customers");
    assert.equal(resolveCompanyOsActiveNavId("/os/sales"), "sales");
    assert.equal(resolveCompanyOsActiveNavId("/os/approvals"), "approvals");
  });
});

describe("company-os-mode", () => {
  it("allows founder tower for admin roles", () => {
    assert.equal(canAccessFounderTower("founder"), true);
    assert.equal(canAccessFounderTower("admin"), true);
    assert.equal(canAccessFounderTower("staff"), false);
  });

  it("maps demo admin roleKey so Founder Tower gate works offline", () => {
    const view = buildDemoRoleView("admin");
    assert.equal(view.roleKey, "admin");
    assert.equal(view.tier, "admin");
    assert.equal(canAccessFounderTower(view.roleKey), true);
  });

  it("resolves demo company mode when unenforced", () => {
    assert.equal(
      resolveCompanyOsMode({ enforced: false, roleKey: "founder" }),
      true,
    );
    assert.equal(resolveCompanyOsMode({ enforced: false, roleKey: "client" }), false);
  });
});

describe("company-os phase 1 pages", () => {
  it("registers founder, sales, and approvals routes", () => {
    for (const segment of ["founder", "sales", "approvals"]) {
      const path = join(websiteRoot, "app", "os", segment, "page.tsx");
      assert.ok(existsSync(path), `missing ${path}`);
      const source = readFileSync(path, "utf8");
      assert.match(source, /export default/);
    }
  });
});
