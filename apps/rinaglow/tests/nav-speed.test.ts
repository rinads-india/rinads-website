import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const root = process.cwd();

describe("R GLOW nav speed wiring", () => {
  it("provides a console loading skeleton and Suspense around page children", () => {
    const loading = readFileSync(join(root, "app/(console)/loading.tsx"), "utf8");
    const layout = readFileSync(join(root, "app/(console)/layout.tsx"), "utf8");
    const fallback = readFileSync(join(root, "components/ConsolePageFallback.tsx"), "utf8");
    assert.match(loading, /ConsolePageFallback/);
    assert.match(fallback, /aria-busy/);
    assert.match(layout, /Suspense fallback=\{<ConsolePageFallback \/>\}/);
    assert.match(layout, /\{children\}/);
  });

  it("caches tenancy and salon deps per RSC request", () => {
    const tenancy = readFileSync(join(root, "lib/tenancy.ts"), "utf8");
    const salon = readFileSync(join(root, "lib/salon.ts"), "utf8");
    const server = readFileSync(join(root, "lib/supabase/server.ts"), "utf8");
    assert.match(tenancy, /cache\(async/);
    assert.match(tenancy, /export const requireTenancy = cache/);
    assert.match(salon, /export const getSalonDeps = cache/);
    assert.match(salon, /export const getSalonRepository = cache/);
    assert.match(server, /export const createRinaglowServerClient = cache/);
  });
});
