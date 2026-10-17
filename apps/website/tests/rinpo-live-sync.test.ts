import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  duplicateAvatarMessage,
  findDuplicateAvatar,
} from "../lib/rinpo-live/sync-guards";

const WORKFLOW = readFileSync(
  new URL("../../../.github/workflows/rinpo-live-sync.yml", import.meta.url),
  "utf8",
);
const CI = readFileSync(new URL("../../../.github/workflows/ci.yml", import.meta.url), "utf8");

/** Workflow lines with comments removed, so prose cannot satisfy or fail a check. */
const CODE_LINES = WORKFLOW.split("\n").filter((line) => !line.trim().startsWith("#"));
const CODE = CODE_LINES.join("\n");

describe("runway:sync duplicate-avatar guard", () => {
  const existing = [
    { id: "a-1", name: "Support Agent" },
    { id: "a-2", name: "RINPO" },
  ];

  it("finds an existing Character by name, ignoring case and spacing", () => {
    assert.deepEqual(findDuplicateAvatar(existing, "rinpo"), { id: "a-2", name: "RINPO" });
    assert.deepEqual(findDuplicateAvatar(existing, "  RINPO "), { id: "a-2", name: "RINPO" });
  });

  it("returns null when the name is free, so creation can proceed", () => {
    assert.equal(findDuplicateAvatar(existing, "RINPO Live"), null);
    assert.equal(findDuplicateAvatar([], "RINPO"), null);
  });

  it("tells the operator how to update or force-create", () => {
    const message = duplicateAvatarMessage({ id: "a-2", name: "RINPO" }, "RINPO");
    assert.match(message, /RUNWAY_AVATAR_ID=a-2/);
    assert.match(message, /--force-create/);
  });
});

describe("RINPO Live sync workflow safety", () => {
  it("is manual only", () => {
    assert.match(CODE, /^on:\n {2}workflow_dispatch:/m);
    for (const trigger of ["pull_request", "pull_request_target", "push:", "schedule:", "workflow_run", "issue_comment"]) {
      assert.equal(CODE.includes(trigger), false, `unexpected trigger: ${trigger}`);
    }
  });

  it("never runs branch code with the secret available", () => {
    assert.match(CODE, /if: github\.ref == 'refs\/heads\/main'/);
  });

  it("uses a read-only token and exposes the secret to exactly one step", () => {
    assert.match(CODE, /^permissions:\n {2}contents: read$/m);
    assert.equal(CODE.split("secrets.").length - 1, 1);
    assert.match(CODE, /^\s+RUNWAYML_API_SECRET: \$\{\{ secrets\.RUNWAYML_API_SECRET \}\}$/m);
  });

  it("passes inputs through env vars only, never interpolated into a script", () => {
    const uses = CODE_LINES.filter((line) => line.includes("${{ inputs."));
    assert.ok(uses.length >= 4);
    for (const line of uses) {
      assert.match(line, /^\s+[A-Z_]+: \$\{\{ inputs\.[a-z_]+ \}\}$/, line);
    }
  });

  it("validates the free-text voice preset before use", () => {
    assert.match(CODE, /\[\[ "\$VOICE_PRESET" =~ \^\[a-z\]\+\$ \]\]/);
  });

  it("defaults to a harmless dry run, with voice cloning off", () => {
    assert.match(WORKFLOW, /dry_run:[\s\S]*?default: true/);
    assert.match(WORKFLOW, /clone_voice:[\s\S]*?default: false/);
  });

  it("does not deploy or touch Vercel, and does not run concurrently", () => {
    assert.doesNotMatch(CODE, /VERCEL_TOKEN|uses:\s*\S*vercel/i);
    assert.match(CODE, /concurrency:\n {2}group: rinpo-live-sync\n {2}cancel-in-progress: false/);
  });

  it("pins the same action versions as CI", () => {
    for (const action of ["actions/checkout@v4", "pnpm/action-setup@v4", "actions/setup-node@v4"]) {
      assert.ok(CI.includes(action), `${action} not used by ci.yml`);
      assert.ok(CODE.includes(action), `${action} missing from the sync workflow`);
    }
  });

  it("runs the sync through the committed package script", () => {
    assert.match(CODE, /pnpm --filter @rinads\/website runway:sync/);
  });
});
