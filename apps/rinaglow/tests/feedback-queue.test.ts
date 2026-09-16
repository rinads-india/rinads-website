import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

describe("low-rating resolution action contract", () => {
  const source = fs.readFileSync(new URL("../app/(console)/dashboard/actions.ts", import.meta.url), "utf8");

  it("requires the review-management permission or a privileged role", () => {
    assert.match(source, /isPrivilegedRoleKey/);
    assert.match(source, /permissions\.includes\("salon\.reviews\.manage"\)/);
    assert.match(source, /if \(!canManage\)/);
  });

  it("passes the active organization into the repository resolution", () => {
    assert.match(source, /resolveLowRatingFollowUp\(tenancy\.organizationId, feedbackId\)/);
  });
});
