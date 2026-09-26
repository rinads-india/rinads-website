import { expect, test } from "@playwright/test";

/**
 * Authenticated tenancy smoke for the RELEASE-ACCEPTANCE matrix. These require
 * founder-provided test personas and a real deployment, so they auto-skip
 * unless the environment is configured. This keeps CI green while giving the
 * founder a ready-to-run harness for the go-live smoke (Step 3 of the runbook).
 *
 * Required env to activate:
 *   E2E_BASE_URL                  e.g. https://www.rinads.com (or a preview)
 *   E2E_GLOW_URL                  e.g. https://glow.rinads.com
 *   E2E_SALON_EMAIL / _PASSWORD   a salon-member account
 *   E2E_MEMBER_EMAIL / _PASSWORD  a non-salon org member
 *   E2E_NOMEMBER_EMAIL/ _PASSWORD an account with no membership
 */
const hasRemote = !!process.env.E2E_BASE_URL;

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).click();
}

test.describe("authenticated tenancy (founder-run)", () => {
  test.skip(!hasRemote, "Set E2E_BASE_URL + E2E_* credentials to run authenticated smoke.");

  test("salon member is routed into R GLOW without a second login", async ({ page }) => {
    test.skip(!process.env.E2E_SALON_EMAIL, "E2E_SALON_EMAIL/PASSWORD not set");
    await signIn(page, process.env.E2E_SALON_EMAIL!, process.env.E2E_SALON_PASSWORD!);
    const glow = process.env.E2E_GLOW_URL ?? "https://glow.rinads.com";
    await page.waitForURL(new RegExp(glow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), { timeout: 20_000 });
    await expect(page).toHaveURL(new RegExp("glow"));
  });

  test("non-salon member stays in /os", async ({ page }) => {
    test.skip(!process.env.E2E_MEMBER_EMAIL, "E2E_MEMBER_EMAIL/PASSWORD not set");
    await signIn(page, process.env.E2E_MEMBER_EMAIL!, process.env.E2E_MEMBER_PASSWORD!);
    await page.goto("/os");
    await expect(page).toHaveURL(/\/os/);
  });

  test("no-membership account enters onboarding", async ({ page }) => {
    test.skip(!process.env.E2E_NOMEMBER_EMAIL, "E2E_NOMEMBER_EMAIL/PASSWORD not set");
    await signIn(page, process.env.E2E_NOMEMBER_EMAIL!, process.env.E2E_NOMEMBER_PASSWORD!);
    await expect(page).toHaveURL(/onboard/i);
  });
});
