import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveAuthCallbackDestination,
  CANONICAL_FORGOT_PASSWORD_URL,
  getSharedAuthCookieOptions,
} from "@rinads/auth";
import { getPortalUrls, getVisibleWebsitePortalLinks } from "../lib/portal-urls";

describe("website auth callback destinations", () => {
  it("accepts local paths and exact portal hosts only", () => {
    assert.equal(resolveAuthCallbackDestination("/auth/reset-password"), "/auth/reset-password");
    assert.equal(
      resolveAuthCallbackDestination("https://admin.rinads.com/tenants"),
      "https://admin.rinads.com/tenants"
    );
    assert.equal(resolveAuthCallbackDestination("https://evil.com/phish"), "/");
    assert.equal(resolveAuthCallbackDestination("//app.rinads.com"), "/");
  });

  it("uses the canonical forgot-password origin", () => {
    assert.equal(CANONICAL_FORGOT_PASSWORD_URL, "https://www.rinads.com/auth/forgot-password");
  });
});

describe("website portal URL config", () => {
  it("uses only trusted local or production portal origins", () => {
    const urls = getPortalUrls();
    assert.match(urls.platform, /localhost:3004|admin\.rinads\.com/);
    assert.match(urls.owner, /localhost:3003|app\.rinads\.com/);
    assert.match(urls.customer, /localhost:3002|customers\.rinads\.com/);
  });

  it("hides platform from client persona", () => {
    const links = getVisibleWebsitePortalLinks("client");
    assert.deepEqual(
      links.map((l) => l.key),
      ["customer"]
    );
  });
});

describe("website cookie helper", () => {
  it("is host-only unless production cookie env is set", () => {
    const options = getSharedAuthCookieOptions({
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    });
    if (process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production")) {
      assert.equal(options.domain, ".rinads.com");
    } else {
      assert.equal(options.domain, undefined);
    }
  });
});
