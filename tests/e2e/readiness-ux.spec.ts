import { expect, test } from "@playwright/test";

test("canonical availability badge agrees with its heading", async ({ page }) => {
  await page.goto("/trust/availability");
  for (const label of ["Available", "Pilot", "Preview", "Roadmap"]) {
    const article = page.getByRole("article").filter({ has: page.getByRole("heading", { name: label, exact: true }) });
    await expect(article.locator(`[aria-label^="Availability: ${label}."]`)).toBeVisible();
  }
});

for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 720 }]) {
  test(`RINPO guest preview and keyboard dismissal at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const launcher = page.getByRole("button", { name: /talk to rinpo/i }).first();
    await launcher.click();
    const phone = page.getByRole("dialog", { name: "RINPO Phone" });
    await expect(phone).toBeVisible();
    await expect(phone.getByText(/Welcome to RINADS\. What would you like to do\?/)).toBeVisible();
    await phone.getByRole("button", { name: "Today (Preview)", exact: true }).click();
    await expect(phone.getByRole("status")).toContainText("not connected to live business data");
    const box = await phone.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    await page.keyboard.press("Escape");
    await expect(phone).toBeHidden();
    await expect(launcher).toBeFocused();
  });
}
