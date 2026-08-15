import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeNextPath, OS_PATH, ONBOARDING_PATH } from "../lib/post-auth-destination";
import { getOsNavItems } from "../lib/os-modules";

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

describe("os-modules", () => {
  it("returns five nav items for client role", () => {
    const items = getOsNavItems("client");
    assert.equal(items.length, 5);
    assert.equal(items[0]?.id, "dashboard");
    assert.equal(items[2]?.href, "/projects");
  });

  it("returns owner portal links for admin role", () => {
    const items = getOsNavItems("admin");
    assert.match(items[0]?.href ?? "", /localhost:3003\/operations/);
  });
});
