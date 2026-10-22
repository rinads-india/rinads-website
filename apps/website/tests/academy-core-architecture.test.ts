import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const REPO_ROOT = join(process.cwd(), "../..");
const core = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20261021160000_academy_core.sql"),
  "utf8",
);
const integrity = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20261021160001_academy_course_integrity.sql"),
  "utf8",
);
const privileges = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20261021160002_academy_privilege_hardening.sql"),
  "utf8",
);

describe("Academy Core architecture", () => {
  it("reuses organization tenancy and Supabase Auth instead of creating Academy identity tables", () => {
    assert.match(core, /organization_id uuid not null references public\.organizations/i);
    assert.match(core, /user_id uuid not null references auth\.users/i);
    assert.doesNotMatch(core, /create table[^;]*academy_users/i);
  });

  it("covers the durable learning graph", () => {
    for (const table of [
      "academy_courses",
      "academy_modules",
      "academy_lessons",
      "academy_cohorts",
      "academy_enrollments",
      "academy_lesson_progress",
      "academy_evidence",
      "academy_certificates",
    ]) {
      assert.match(core, new RegExp(`create table if not exists public\\.${table}`, "i"));
    }
  });

  it("keeps Data API privileges explicit and excludes anonymous access", () => {
    assert.match(privileges, /revoke all[\s\S]*academy_courses[\s\S]*from anon, authenticated/i);
    assert.match(privileges, /grant select, insert, update[\s\S]*to authenticated/i);
    assert.match(privileges, /grant all[\s\S]*to service_role/i);
    assert.doesNotMatch(privileges, /grant delete[\s\S]*to authenticated/i);
  });

  it("constrains learner progress and evidence to the learner's active enrollment", () => {
    assert.match(core, /academy_progress_insert[\s\S]*e\.user_id = \(select auth\.uid\(\)\)[\s\S]*e\.status = 'active'/i);
    assert.match(core, /academy_evidence_insert[\s\S]*submitted_by = \(select auth\.uid\(\)\)[\s\S]*e\.status = 'active'/i);
  });

  it("enforces same-course relationships beyond organization tenancy", () => {
    assert.match(integrity, /academy_lessons_module_same_course_fk/i);
    assert.match(integrity, /academy_enrollments_cohort_same_course_fk/i);
    assert.match(integrity, /academy_progress_enrollment_same_course_fk/i);
    assert.match(integrity, /academy_progress_lesson_same_course_fk/i);
    assert.match(integrity, /academy_evidence_enrollment_same_course_fk/i);
    assert.match(integrity, /academy_evidence_lesson_same_course_fk/i);
  });

  it("binds certificates to the same enrollment user", () => {
    assert.match(integrity, /academy_certificates_enrollment_same_user_fk/i);
    assert.match(integrity, /references public\.academy_enrollments\(organization_id, id, user_id\)/i);
  });
});
