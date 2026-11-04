import { expect, test } from "@playwright/test";

/**
 * Credential-free website smoke. Runs in CI against a locally-built
 * production server (or a remote deploy when E2E_BASE_URL is set).
 */

test("homepage renders the marketing hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/RINADS/i);
  await expect(
    page.getByRole("heading", { level: 1, name: /business, simplified/i }),
  ).toBeVisible();
  await expect(page.getByText("Synthetic demo")).toBeVisible();
});

test("health endpoint reports a valid production env contract", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.checks?.productionEnvContract).toBe("ok");
});

test("anonymous /os is gated to a sign-in surface", async ({ page }) => {
  await page.goto("/os");
  // The OS shell must never render authenticated modules for an anonymous
  // visitor; it redirects to a login/sign-up surface.
  await expect(page).toHaveURL(/\/(login|signup|auth|os)/);
  await expect(page.getByText(/sign in|sign up|log in/i).first()).toBeVisible();
});

test("a key marketing route responds", async ({ page }) => {
  const res = await page.goto("/pricing");
  expect(res?.status()).toBeLessThan(400);
});
