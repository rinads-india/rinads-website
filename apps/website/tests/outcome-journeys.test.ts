import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OUTCOME_JOURNEYS } from "../lib/content/outcome-journeys";
import { ROUTE_REGISTRY } from "../lib/route-registry";

describe("enterprise outcome journeys", () => {
  it("links only to registered or known contact paths", () => {
    const registered = new Set(ROUTE_REGISTRY.map((r) => r.path));
    for (const journey of OUTCOME_JOURNEYS) {
      const path = journey.href.split("?")[0] ?? journey.href;
      assert.ok(
        registered.has(path) || path === "/contact",
        `unexpected journey href: ${journey.href}`,
      );
    }
  });

  it("is wired on platform and solutions clients", () => {
    const platform = readFileSync(join(process.cwd(), "app/platform/PlatformClient.tsx"), "utf8");
    const solutions = readFileSync(join(process.cwd(), "app/solutions/SolutionsClient.tsx"), "utf8");
    assert.match(platform, /OutcomeJourneySection/);
    assert.match(solutions, /OutcomeJourneySection/);
  });
});
