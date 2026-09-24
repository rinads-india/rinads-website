import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeNextPath, OS_PATH, ONBOARDING_PATH } from "../lib/post-auth-destination";
import { getOsNavItems } from "../lib/os-modules";
import {
  getOsDesktopNavItems,
  getOsMobileMoreNavItems,
  getOsMobilePrimaryNavItems,
  osNavContainsDashboardLabel,
  resolveOsActiveNavId,
} from "../lib/os-nav";

describe("post-auth-destination", () => {
  it("sanitizes safe internal next paths", () => {
    assert.equal(sanitizeNextPath("/os"), "/os");
    assert.equal(sanitizeNextPath("//evil.com"), null);
    assert.equal(sanitizeNextPath("https://evil.com"), null);
  });

  it("exports stable OS paths", () => {
    assert.equal(OS_PATH, "/os");
    assert.equal(ONBOARDING_PATH, "/onboarding/create-organization");
  });
});

describe("os-nav", () => {
  it("uses Home as the first desktop nav item under /os", () => {
    const items = getOsDesktopNavItems();
    assert.equal(items[0]?.id, "home");
    assert.equal(items[0]?.label, "Home");
    assert.equal(items[0]?.href, "/os");
    assert.equal(osNavContainsDashboardLabel(items), false);
  });

  it("keeps primary nav hrefs inside /os", () => {
    for (const item of getOsDesktopNavItems()) {
      assert.ok(item.href.startsWith("/os"), `${item.id} must stay in Business OS shell`);
    }
  });

  it("exposes mobile primary and More membership", () => {
    const primary = getOsMobilePrimaryNavItems();
    assert.deepEqual(
      primary.map((item) => item.id),
      ["home", "customers", "work", "growth", "more"]
    );
    const more = getOsMobileMoreNavItems("admin");
    assert.ok(more.some((item) => item.id === "money"));
    assert.ok(more.some((item) => item.id === "automate"));
    assert.ok(more.some((item) => item.id === "rooms"));
    assert.ok(more.some((item) => item.id === "settings"));
    assert.equal(osNavContainsDashboardLabel(primary), false);
    assert.equal(osNavContainsDashboardLabel(more), false);

    const clientMore = getOsMobileMoreNavItems("client");
    assert.ok(!clientMore.some((item) => item.id === "money"));
    assert.ok(!clientMore.some((item) => item.id === "settings"));
  });

  it("resolves active nav ids from nested paths", () => {
    assert.equal(resolveOsActiveNavId("/os"), "home");
    assert.equal(resolveOsActiveNavId("/os/"), "home");
    assert.equal(resolveOsActiveNavId("/os/home"), "home");
    assert.equal(resolveOsActiveNavId("/os/work/projects"), "work");
    assert.equal(resolveOsActiveNavId("/os/rooms"), "rooms");
    assert.equal(resolveOsActiveNavId("/os/settings"), "settings");
  });

  it("getOsNavItems alias matches desktop nav without Dashboard", () => {
    const items = getOsNavItems();
    assert.equal(items[0]?.id, "home");
    assert.ok(!items.some((item) => item.label === "Dashboard"));
  });
});

describe("bos redirects", () => {
  it("registers temporary /bos compatibility redirects", () => {
    const source = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    assert.match(source, /source: "\/bos"/);
    assert.match(source, /destination: "\/os"/);
    assert.match(source, /source: "\/bos\/customers"/);
    assert.match(source, /destination: "\/os\/customers"/);
  });
});
