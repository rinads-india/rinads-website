import { expect, test, type Page } from "@playwright/test";

/**
 * Company OS acceptance.
 *
 * Part 1 runs anywhere with no credentials: anonymous visitors never see a Company OS workspace and
 * the RINPO company endpoint never answers with company data.
 *
 * Part 2 is founder-run against a deployment with the Company OS migrations applied and test personas:
 *   E2E_BASE_URL
 *   E2E_FOUNDER_EMAIL / E2E_FOUNDER_PASSWORD   founder or admin of an organisation
 *   E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD       a `staff` role member of the same organisation
 * It auto-skips otherwise.
 */
const AREAS = [
  "/os/founder", "/os/customers", "/os/sales", "/os/work", "/os/studio", "/os/growth", "/os/ads", "/os/engineering", "/os/ai", "/os/commerce",
  "/os/finance", "/os/people", "/os/logistics", "/os/communication", "/os/academy", "/os/platforms", "/os/assets", "/os/approvals", "/os/reports", "/os/settings",
];

test.describe("anonymous visitors", () => {
  for (const path of AREAS) {
    test(`${path} does not render a workspace`, async ({ page }) => {
      await page.goto(path);
      // Supabase mode redirects to sign-in; demo mode renders the explicit "needs a live organisation" notice.
      // Either way no company data, tables or metrics are shown.
      const body = (await page.locator("body").innerText()).toLowerCase();
      expect(body).not.toMatch(/outstanding|weighted value|pipeline by stage/);
      expect(page.url()).toMatch(/\/(login|signup|auth|os)/);
    });
  }

  test("the RINPO company endpoint never answers anonymously", async ({ request }) => {
    const res = await request.post("/api/os/rinpo", { data: { message: "How is RINADS today?" } });
    if (res.status() === 401) return;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.reply).toBeUndefined();
  });

  test("the RINPO company endpoint rejects malformed input", async ({ request }) => {
    const res = await request.post("/api/os/rinpo", { data: { message: "x".repeat(600) } });
    expect(res.status()).toBe(400);
  });
});

const hasFounder = !!process.env.E2E_BASE_URL && !!process.env.E2E_FOUNDER_EMAIL && !!process.env.E2E_FOUNDER_PASSWORD;
const hasStaff = !!process.env.E2E_BASE_URL && !!process.env.E2E_STAFF_EMAIL && !!process.env.E2E_STAFF_PASSWORD;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).click();
  await page.waitForURL(/\/os/, { timeout: 30_000 });
}

test.describe("founder persona (founder-run)", () => {
  test.skip(!hasFounder, "Set E2E_BASE_URL + E2E_FOUNDER_EMAIL/PASSWORD to run.");

  test("every area renders without server errors, console errors or placeholder text", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await signIn(page, process.env.E2E_FOUNDER_EMAIL!, process.env.E2E_FOUNDER_PASSWORD!);
    for (const path of AREAS) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(500);
      await expect(page.getByRole("heading", { level: 1 }).first(), path).toBeVisible();
      const text = await page.locator("main").innerText();
      expect(text, `${path} shows a broken value`).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);
    }
    expect(errors.filter((e) => !/favicon|ResizeObserver/i.test(e))).toEqual([]);
  });

  test("RINPO answers 'How is RINADS today?' from real data and states what is unavailable", async ({ page }) => {
    await signIn(page, process.env.E2E_FOUNDER_EMAIL!, process.env.E2E_FOUNDER_PASSWORD!);
    const res = await page.request.post("/api/os/rinpo", { data: { message: "How is RINADS today?" } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.matched).toBe(true);
    expect(body.briefing.basis).toBe("facts");
    for (const key of ["whatHappened", "whatChanged", "atRisk", "whyItMatters", "owners", "nextSteps", "canExecute", "requiresApproval", "unavailable"]) {
      expect(body.briefing, key).toHaveProperty(key);
    }
  });
});

test.describe("staff persona (founder-run)", () => {
  test.skip(!hasStaff, "Set E2E_BASE_URL + E2E_STAFF_EMAIL/PASSWORD to run.");

  test("restricted areas explain the missing permission and show no data", async ({ page }) => {
    await signIn(page, process.env.E2E_STAFF_EMAIL!, process.env.E2E_STAFF_PASSWORD!);
    for (const path of ["/os/founder", "/os/finance", "/os/engineering", "/os/ai"]) {
      await page.goto(path);
      await expect(page.getByText(/does not include access/i), path).toBeVisible();
      const text = (await page.locator("main").innerText()).toLowerCase();
      expect(text, path).not.toMatch(/outstanding|weighted value|failing checks/);
    }
  });

  test("staff cannot decide a pending approval they are not allowed to decide", async ({ page }) => {
    await signIn(page, process.env.E2E_STAFF_EMAIL!, process.env.E2E_STAFF_PASSWORD!);
    await page.goto("/os/approvals");
    for (const btn of await page.getByRole("button", { name: /^approve/i }).all()) await expect(btn).toBeDisabled();
  });
});
