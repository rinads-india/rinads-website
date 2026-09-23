import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  PROJECT_GOALS,
  createEmptyProjectIntake,
  generateProjectBrief,
} from "../lib/project-intake";
import { validateProjectIntakeSubmission } from "../lib/project-intake-security";

describe("Project Intake UX V2 contracts", () => {
  it("offers outcome-first project goals instead of legacy agency categories", () => {
    assert.equal(PROJECT_GOALS.length, 9);
    assert.deepEqual(
      PROJECT_GOALS.slice(0, 4).map((item) => item.id),
      ["run", "build", "grow", "sell"]
    );
  });

  it("generates a deterministic brief without inventing commercial commitments", () => {
    const draft = {
      ...createEmptyProjectIntake(),
      goal: "build" as const,
      company: "Example Co",
      problem: "Work is split across spreadsheets.",
      desiredOutcome: "One operating system for the team.",
      selectedNeeds: ["ERP", "Web App"],
      budgetRange: "₹3–5 lakhs",
      timeline: "1–3 months",
    };

    const brief = generateProjectBrief(draft);

    assert.equal(brief.goalLabel, "Build software");
    assert.deepEqual(brief.scope, ["ERP", "Web App"]);
    assert.match(brief.nextStep, /before any scope, price, schedule, or delivery commitment/i);
  });

  it("requires contact, problem, outcome, and consent before server submission", () => {
    const invalid = validateProjectIntakeSubmission({
      goal: "build",
      name: "A",
      email: "a@example.com",
      problem: "Need a system",
      desiredOutcome: "Better operations",
      selectedNeeds: [],
      brief: generateProjectBrief({
        ...createEmptyProjectIntake(),
        goal: "build",
        problem: "Need a system",
        desiredOutcome: "Better operations",
      }),
      consent: false,
    });

    assert.ok("error" in invalid);
    if ("error" in invalid) assert.match(invalid.error, /Consent is required/);
  });

  it("uses a real project-intake API rather than a fake timeout success", () => {
    const source = readFileSync(
      new URL("../components/projects/ProjectsLanding.tsx", import.meta.url),
      "utf8"
    );

    assert.match(source, /fetch\("\/api\/project-intake"/);
    assert.match(source, /Submit for human review/);
    assert.doesNotMatch(source, /setTimeout\(resolve/);
    assert.doesNotMatch(source, /Expect a reply within 24 hours/);
  });

  it("keeps project-intake persistence server-only", () => {
    const route = readFileSync(
      new URL("../app/api/project-intake/route.ts", import.meta.url),
      "utf8"
    );
    const migration = readFileSync(
      new URL("../../../supabase/migrations/20260923100000_project_intakes.sql", import.meta.url),
      "utf8"
    );

    assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(route, /projectIntakeRateLimiter/);
    assert.match(migration, /enable row level security/i);
    assert.match(migration, /revoke all on table public\.project_intakes from public, anon, authenticated/i);
    assert.match(migration, /grant all on table public\.project_intakes to service_role/i);
  });
});
