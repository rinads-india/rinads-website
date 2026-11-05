import { expect, test } from "@playwright/test";

/**
 * Credential-free website smoke. Runs in CI against a locally-built
 * production server (or a remote deploy when E2E_BASE_URL is set).
 */

test("homepage renders the marketing hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/RINADS/i);
  await expect(
    page.getByRole("heading", { level: 1, name: /^business, simplified[.]?$/i }),
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

test("mobile RINPO Phone is a keyboard-accessible, honest preview", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const launcher = page.getByRole("button", { name: /open rinpo phone.*rinpo runtime/i });
  await expect(launcher).toBeVisible();
  await launcher.click();

  const phone = page.getByRole("dialog", { name: "RINPO Phone" });
  await expect(phone).toBeVisible();
  const frame = await phone.boundingBox();
  expect(frame).not.toBeNull();
  expect(frame!.y).toBeGreaterThanOrEqual(0);
  expect(frame!.y + frame!.height).toBeLessThanOrEqual(813);

  await phone.getByRole("button", { name: "Today (Preview)", exact: true }).click();
  await expect(phone.getByRole("status")).toContainText("not connected to live business data");

  await page.keyboard.press("Escape");
  await expect(phone).toBeHidden();
  await expect(launcher).toBeFocused();
});
