import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

/**
 * Regression tests for the production env-contract hardening added after
 * the MIDDLEWARE_INVOCATION_FAILED outage on rinads.com: a bare, unguarded
 * `assertProductionEnvContract()` call in middleware threw and crashed the
 * whole middleware invocation instead of failing gracefully.
 *
 * These are static source-pattern checks (not full builds) so they run fast
 * in every app's normal `test` script and catch a regression — e.g. a new
 * app added without the gate, or someone reintroducing the throwing call in
 * middleware — without needing a live Vercel deployment to reproduce.
 */

const APPS = [
  "customer-portal",
  "owner-portal",
  "platform-admin",
  "rinaglow",
  "storefront",
  "website",
];

function readAppFile(app: string, relativePath: string): string {
  return readFileSync(join(process.cwd(), "../", app, relativePath), "utf8");
}

describe("production env contract: build-time gate (next.config.ts)", () => {
  for (const app of APPS) {
    it(`apps/${app}/next.config.ts imports and calls assertProductionEnvContract at module scope`, () => {
      const config = readAppFile(app, "next.config.ts");
      assert.match(
        config,
        /import\s*\{[^}]*\bassertProductionEnvContract\b[^}]*\}\s*from\s*["']@rinads\/auth["']/,
        `apps/${app}/next.config.ts must import assertProductionEnvContract from @rinads/auth`
      );
      assert.match(
        config,
        /^assertProductionEnvContract\(\);/m,
        `apps/${app}/next.config.ts must call assertProductionEnvContract() at module scope so a misconfigured Production build fails outright`
      );
    });
  }
});

describe("production env contract: runtime guard (middleware.ts)", () => {
  for (const app of APPS) {
    it(`apps/${app}/middleware.ts uses the non-throwing checkProductionEnvContract, not the throwing assert`, () => {
      const middleware = readAppFile(app, "middleware.ts");
      assert.match(
        middleware,
        /import\s*\{[^}]*\bcheckProductionEnvContract\b[^}]*\}\s*from\s*["']@rinads\/auth["']/,
        `apps/${app}/middleware.ts must import checkProductionEnvContract from @rinads/auth`
      );
      assert.doesNotMatch(
        middleware,
        /[^.]\bassertProductionEnvContract\s*\(/,
        `apps/${app}/middleware.ts must not call the throwing assertProductionEnvContract() — an unguarded throw here crashes the whole middleware invocation (MIDDLEWARE_INVOCATION_FAILED)`
      );
    });

    it(`apps/${app}/middleware.ts returns a controlled response when the env contract check fails`, () => {
      const middleware = readAppFile(app, "middleware.ts");
      assert.match(
        middleware,
        /if\s*\(\s*!envContract\.ok\s*\)\s*\{[\s\S]{0,400}?status:\s*503/,
        `apps/${app}/middleware.ts must return a 503 when checkProductionEnvContract() reports ok:false, instead of letting the request fall through`
      );
    });

    it(`apps/${app}/middleware.ts excludes api/health from its matcher`, () => {
      const middleware = readAppFile(app, "middleware.ts");
      assert.match(
        middleware,
        /matcher:\s*\[[\s\S]*?api\/health[\s\S]*?\]/,
        `apps/${app}/middleware.ts matcher must exclude api/health so the health check stays reachable when the env contract check fails`
      );
    });
  }
});

describe("production env contract: health endpoint", () => {
  for (const app of APPS) {
    it(`apps/${app}/app/api/health/route.ts exists and reports productionEnvContract status`, () => {
      const routePath = join(process.cwd(), "../", app, "app/api/health/route.ts");
      assert.ok(existsSync(routePath), `apps/${app} is missing app/api/health/route.ts`);
      const route = readFileSync(routePath, "utf8");
      assert.match(
        route,
        /checkProductionEnvContract/,
        `apps/${app}/app/api/health/route.ts must call checkProductionEnvContract() to report live config health`
      );
      assert.match(
        route,
        /force-dynamic/,
        `apps/${app}/app/api/health/route.ts must opt out of static optimization so it reflects the current env on every request`
      );
    });
  }
});
