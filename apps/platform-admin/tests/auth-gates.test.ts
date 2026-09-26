import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolvePortalMiddlewareDecision } from "@rinads/auth";
import { PLATFORM_PUBLIC_PATHS } from "../lib/access";

describe("platform-admin auth gates", () => {
  it("keeps health and razorpay webhook public", () => {
    assert.deepEqual([...PLATFORM_PUBLIC_PATHS], ["/api/webhooks/razorpay"]);
    assert.equal(
      resolvePortalMiddlewareDecision({
        pathname: "/api/health",
        isAuthenticated: false,
        extraPublicPaths: PLATFORM_PUBLIC_PATHS,
      }).type,
      "next"
    );
    assert.equal(
      resolvePortalMiddlewareDecision({
        pathname: "/api/webhooks/razorpay",
        isAuthenticated: false,
        extraPublicPaths: PLATFORM_PUBLIC_PATHS,
      }).type,
      "next"
    );
  });

  it("fails closed to login for the control plane", () => {
    const decision = resolvePortalMiddlewareDecision({
      pathname: "/tenants",
      isAuthenticated: false,
      extraPublicPaths: PLATFORM_PUBLIC_PATHS,
    });
    assert.equal(decision.type, "redirect");
    if (decision.type === "redirect") {
      assert.equal(decision.to, "/login?next=%2Ftenants");
    }
  });

  it("uses a dedicated login page and vercel project filter", () => {
    const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
    assert.match(login, /Sign in/);
    const vercel = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
    ) as { buildCommand: string };
    assert.match(vercel.buildCommand, /@rinads\/platform-admin/);
  });
});
