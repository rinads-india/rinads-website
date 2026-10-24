import { expect, test } from "@playwright/test";

/**
 * Credential-free production smoke. Runs in CI against a locally-started
 * website dev server (or a remote deploy when E2E_BASE_URL is set).
 */

test("homepage renders the marketing hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/RINADS/i);
  await expect(
    page.getByRole("heading", { name: /business intelligence infrastructure/i }),
  ).toBeVisible();
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

test("anonymous RINASPACE redirects to RI ID signup", async ({ page }) => {
  await page.goto("/space");
  await expect(page).toHaveURL(/\/signup.*returnTo=(%2F|\/)space/i);
});

test("anonymous RINPO Phone redirects to RI ID login", async ({ page }) => {
  await page.goto("/phone");
  await expect(page).toHaveURL(/\/signup.*mode=login.*next=(%2F|\/)phone/i);
});

test("anonymous nested Business OS route cannot expose tenant data", async ({ page }) => {
  await page.goto("/os/customers");
  await expect(page).toHaveURL(/\/(login|signup|auth|os)/);
  await expect(page.getByText(/sign in|sign up|log in/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /customers/i })).toHaveCount(0);
});

test("a key marketing route responds", async ({ page }) => {
  const res = await page.goto("/pricing");
  expect(res?.status()).toBeLessThan(400);
});
