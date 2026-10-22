import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const root = process.cwd();

describe("R GLOW Front Desk v3", () => {
  it("orchestrates the governed appointment-to-payment workflow from one route", () => {
    const page = readFileSync(join(root, "app/(console)/front-desk/page.tsx"), "utf8");
    assert.match(page, /getBusinessSummary/);
    assert.match(page, /AppointmentActions/);
    assert.match(page, /StartSaleButton/);
    assert.match(page, /SaleCard/);
    assert.match(page, /NewAppointmentForm/);
    assert.match(page, /Arrivals/);
    assert.match(page, /Waiting/);
    assert.match(page, /In chair/);
    assert.match(page, /Ready for checkout/);
    assert.match(page, /Open sales/);
    assert.match(page, /Post-visit automation/);
    assert.match(page, /review_request/);
    assert.match(page, /loyalty\.getBalance/);
    assert.doesNotMatch(page, /demoContext|USE_DEMO_STORE|mock/i);
  });

  it("keeps front desk fresh after appointment and POS mutations", () => {
    const appointmentActions = readFileSync(join(root, "app/(console)/calendar/actions.ts"), "utf8");
    const posActions = readFileSync(join(root, "app/(console)/pos/actions.ts"), "utf8");
    assert.match(appointmentActions, /revalidatePath\("\/front-desk"\)/);
    assert.match(posActions, /revalidatePath\("\/front-desk"\)/);
  });

  it("promotes Front Desk to the primary mobile workflow and preserves Calendar in More", () => {
    const nav = readFileSync(join(root, "components/RinaglowNav.tsx"), "utf8");
    assert.match(nav, /\{ href: "\/front-desk", label: "Front Desk" \}/);
    assert.match(nav, /mobilePrimary = \["\/dashboard", "\/front-desk", "\/pos", "\/clients"\]/);
    assert.match(nav, /\{ href: "\/calendar", label: "Calendar" \}/);
  });

  it("allows the walk-in form to preserve the selected branch", () => {
    const form = readFileSync(join(root, "app/(console)/calendar/NewAppointmentForm.tsx"), "utf8");
    assert.match(form, /defaultBranchId/);
    assert.match(form, /branches\.some\(\(branch\) => branch\.id === defaultBranchId\)/);
  });
});
