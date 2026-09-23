import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { SERVICE_LINES } from "../lib/content/services";
import { SERVICE_EXPERIENCES } from "../lib/service-experience";
import { ACADEMY_PROGRAMS } from "../lib/content/academy";
import { ACADEMY_EXPERIENCES } from "../lib/academy-experience";

describe("Services and Academy UX V2 contracts", () => {
  it("defines seven distinct public service verbs", () => {
    const verbs = Object.values(SERVICE_EXPERIENCES).map((item) => item.publicVerb);

    assert.deepEqual(verbs, [
      "BUILD",
      "GROW",
      "INTELLIGENCE",
      "AUTOMATE",
      "CREATE",
      "TRANSFORM",
      "TRAIN",
    ]);
    assert.equal(new Set(verbs).size, 7);
  });

  it("keeps one service experience for every public service line", () => {
    assert.equal(Object.keys(SERVICE_EXPERIENCES).length, SERVICE_LINES.length);

    for (const service of SERVICE_LINES) {
      const experience = SERVICE_EXPERIENCES[service.slug as keyof typeof SERVICE_EXPERIENCES];
      assert.ok(experience, `missing service experience for ${service.slug}`);
      assert.ok(experience.platform.length >= 3);
      assert.ok(experience.process.length >= 7);
    }
  });

  it("keeps Intelligence & AI distinct from Automation", () => {
    const intelligence = SERVICE_LINES.find((item) => item.slug === "ai");
    const automation = SERVICE_LINES.find((item) => item.slug === "automation");

    assert.ok(intelligence);
    assert.ok(automation);
    assert.equal(intelligence.name, "Intelligence & AI");
    assert.equal(intelligence.verb, "Intelligence");
    assert.equal(automation.verb, "Automate");
  });

  it("defines a real-experience path for every Academy program", () => {
    assert.equal(Object.keys(ACADEMY_EXPERIENCES).length, ACADEMY_PROGRAMS.length);

    for (const program of ACADEMY_PROGRAMS) {
      const experience = ACADEMY_EXPERIENCES[program.slug as keyof typeof ACADEMY_EXPERIENCES];
      assert.ok(experience, `missing academy experience for ${program.slug}`);
      assert.ok(experience.practice.length > 0);
      assert.ok(experience.work.length > 0);
      assert.ok(experience.ship.length > 0);
      assert.ok(experience.measure.length > 0);
    }
  });

  it("removes unverified recurring live-class schedules from the Academy landing page", () => {
    const source = readFileSync(
      new URL("../app/academy/AcademyClient.tsx", import.meta.url),
      "utf8"
    );

    assert.doesNotMatch(source, /Weekly live/);
    assert.doesNotMatch(source, /Weekend intensives/);
    assert.doesNotMatch(source, /Bi-weekly/);
    assert.doesNotMatch(source, /LiveClassCard/);
  });

  it("keeps Academy schedule language explicit about confirmation", () => {
    const source = readFileSync(
      new URL("../components/system/AcademyProgramPage.tsx", import.meta.url),
      "utf8"
    );

    assert.match(source, /Specific cohorts, dates, instructors, and schedules should only be treated as confirmed when published separately/);
  });
});
