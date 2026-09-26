import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for the public website / Business OS shell.
 *
 * - `smoke.spec.ts` runs anywhere (no credentials) and is what CI executes.
 * - `auth.spec.ts` is authenticated tenancy coverage; it auto-skips unless
 *   `E2E_BASE_URL` and the `E2E_*` credentials are provided (founder-run).
 *
 * By default it targets a local website dev server (auto-started below). Set
 * `E2E_BASE_URL` to point at a preview/production deployment instead, in which
 * case no local server is started.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: useLocalServer
    ? {
        command: "pnpm --filter @rinads/website dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
