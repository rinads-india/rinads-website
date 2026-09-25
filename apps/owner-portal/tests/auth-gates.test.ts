import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolvePortalMiddlewareDecision } from "@rinads/auth";

describe("owner-portal auth gates", () => {
  it("fails closed to login and keeps health public", () => {
    assert.equal(
      resolvePortalMiddlewareDecision({
        pathname: "/api/health",
        isAuthenticated: false,
      }).type,
      "next"
    );
    const decision = resolvePortalMiddlewareDecision({
      pathname: "/operations",
      isAuthenticated: false,
    });
    assert.equal(decision.type, "redirect");
    if (decision.type === "redirect") {
      assert.equal(decision.to, "/login?next=%2Foperations");
    }
  });

  it("uses a dedicated login page and vercel project filter", () => {
    const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
    assert.match(login, /Sign in/);
    const vercel = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
    ) as { buildCommand: string };
    assert.match(vercel.buildCommand, /@rinads\/owner-portal/);
  });
});
