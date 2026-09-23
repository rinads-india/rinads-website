import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { VERTICALS } from "../lib/content/verticals";
import {
  SOLUTION_EXPERIENCES,
  getSolutionExperience,
} from "../lib/solution-experience";

describe("Solutions UX V2 contracts", () => {
  it("defines one experience for every public solution vertical", () => {
    assert.equal(Object.keys(SOLUTION_EXPERIENCES).length, VERTICALS.length);

    for (const vertical of VERTICALS) {
      const experience = getSolutionExperience(vertical.slug);
      assert.ok(experience, `missing solution experience for ${vertical.slug}`);
      assert.ok(experience.workflow.length >= 6);
      assert.ok(experience.foundation.length >= 4);
    }
  });

  it("keeps current availability truthful", () => {
    const available = VERTICALS.filter((vertical) => vertical.status === "available").map((vertical) => vertical.slug);
    const coming = VERTICALS.filter((vertical) => vertical.status === "coming").map((vertical) => vertical.slug);

    assert.deepEqual(available, ["retail", "nursery", "salon"]);
    assert.deepEqual(coming, ["jewellery", "healthcare", "logistics"]);
  });

  it("uses the R GLOW public identity for the salon solution", () => {
    const salon = VERTICALS.find((vertical) => vertical.slug === "salon");
    assert.ok(salon);
    assert.equal(salon.name, "Salon / R GLOW");
    assert.ok(salon.capabilities.includes("POS & refunds"));
    assert.ok(salon.capabilities.includes("Reviews & recovery"));
  });

  it("keeps healthcare scoped to non-clinical operations", () => {
    const healthcare = getSolutionExperience("healthcare");
    assert.ok(healthcare);
    assert.match(healthcare.demoSummary, /not presented as a clinical decision system/i);

    const source = readFileSync(
      new URL("../components/system/VerticalSolutionExperience.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /does not claim diagnosis, treatment recommendations, clinical decision support/i);
  });

  it("keeps coming-soon solution pages distinct from production availability", () => {
    const source = readFileSync(
      new URL("../components/system/VerticalSolutionExperience.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /Coming-soon visuals do not imply production availability/);
  });
});
