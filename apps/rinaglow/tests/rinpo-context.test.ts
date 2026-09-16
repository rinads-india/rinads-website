import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { getRinpoPageContext } from "../lib/rinpo-page-context";

describe("RINPO page context", () => {
  it("extracts customer route and selected appointment, sale, and branch parameters", () => {
    const context = getRinpoPageContext(
      "/clients/customer-1",
      new URLSearchParams("branch=branch-1&appointment=appointment-1&sale=sale-1")
    );
    assert.deepEqual(context, {
      defaultBranchId: "branch-1",
      selectedAppointmentId: "appointment-1",
      selectedSaleId: "sale-1",
      selectedCustomerId: "customer-1",
    });
  });

  it("does not infer IDs from unrelated routes", () => {
    assert.deepEqual(getRinpoPageContext("/clients", new URLSearchParams()), {
      defaultBranchId: undefined,
      selectedAppointmentId: undefined,
      selectedSaleId: undefined,
      selectedCustomerId: undefined,
    });
  });

  it("requires server-side organization matches before forwarding selected IDs", () => {
    const source = fs.readFileSync(new URL("../app/(console)/rinpo-actions.ts", import.meta.url), "utf8");
    assert.match(source, /customer\.data\.organizationId === tenancy\.organizationId/);
    assert.match(source, /appointment\.data\.organizationId === tenancy\.organizationId/);
    assert.match(source, /sale\.data\.organizationId === tenancy\.organizationId/);
  });
});
