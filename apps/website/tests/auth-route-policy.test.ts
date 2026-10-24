import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWebsiteLoginRedirect,
  isWebsiteProtectedPath,
  resolveWebsiteAuthDecision,
} from "../lib/auth-route-policy";

describe("website protected-route policy", () => {
  it("protects Business OS, onboarding and RINASPACE route trees", () => {
    for (const pathname of [
      "/os",
      "/os/",
      "/os/customers",
      "/onboarding",
      "/onboarding/create-organization",
      "/onboarding/provisioning",
      "/space",
      "/space/",
    ]) {
      assert.equal(isWebsiteProtectedPath(pathname), true, pathname);
    }
  });

  it("does not over-match public paths", () => {
    for (const pathname of [
      "/",
      "/signup",
      "/auth/callback",
      "/business-os",
      "/oscar",
      "/onboard",
      "/spaces",
      "/services",
    ]) {
      assert.equal(isWebsiteProtectedPath(pathname), false, pathname);
    }
  });

  it("redirects an unauthenticated Supabase request and preserves safe next", () => {
    const result = resolveWebsiteAuthDecision({
      pathname: "/os/customers",
      search: "?tab=active",
      authMode: "supabase",
      isAuthenticated: false,
    });
    assert.deepEqual(result, {
      type: "redirect",
      to: "/signup?mode=login&next=%2Fos%2Fcustomers%3Ftab%3Dactive",
    });
  });

  it("allows an authenticated Supabase request", () => {
    assert.deepEqual(
      resolveWebsiteAuthDecision({
        pathname: "/onboarding/create-organization",
        authMode: "supabase",
        isAuthenticated: true,
      }),
      { type: "next" }
    );
  });

  it("keeps demo routing behavior unchanged", () => {
    assert.deepEqual(
      resolveWebsiteAuthDecision({
        pathname: "/os",
        authMode: "demo",
        isAuthenticated: false,
      }),
      { type: "next" }
    );
  });

  it("never creates an external login next target", () => {
    for (const malicious of ["//evil.example", "/\\evil.example", "\\\\evil.example"]) {
      const redirect = buildWebsiteLoginRedirect(malicious);
      const params = new URLSearchParams(redirect.split("?")[1]);
      const next = params.get("next");
      assert.ok(next?.startsWith("/"), malicious);
      assert.equal(next?.startsWith("//"), false, malicious);
      assert.equal(next?.includes("evil.example"), false, malicious);
    }
  });
});
