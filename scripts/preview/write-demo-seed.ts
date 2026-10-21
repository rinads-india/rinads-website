/**
 * Generates the SYNTHETIC Company OS preview data for an isolated, non-production Supabase database.
 *
 *   pnpm exec tsx scripts/preview/write-demo-seed.ts            -> supabase/preview/company-os-demo.sql  (committed, no secrets)
 *   pnpm exec tsx scripts/preview/write-demo-seed.ts --personas <out.sql> <out-credentials.json>
 *        -> persona login SQL with RANDOM passwords generated now. Both files are written outside the repo by the
 *           caller's choice of path and must never be committed (the repo's .gitignore does not cover arbitrary paths).
 *
 * Neither output can run against production: the SQL refuses unless `rinads.allow_demo_seed = 'yes'` is set and the
 * database holds no organisation other than the demo tenants (and the migration-seeded `staging-demo` fixture).
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PERSONAS, buildDemoSeedSql, buildPersonaSql } from "../../packages/company-os-server/src/demo-seed";

const args = process.argv.slice(2);
if (args[0] === "--personas") {
  const [, sqlOut, credOut] = args;
  if (!sqlOut || !credOut) throw new Error("usage: --personas <out.sql> <out-credentials.json>");
  if (resolve(sqlOut).startsWith(resolve(__dirname, "../..")) || resolve(credOut).startsWith(resolve(__dirname, "../.."))) {
    throw new Error("Refusing to write credentials inside the repository.");
  }
  const passwords = Object.fromEntries(PERSONAS.map((p) => [p.key, randomBytes(18).toString("base64url")]));
  mkdirSync(dirname(resolve(sqlOut)), { recursive: true });
  writeFileSync(sqlOut, buildPersonaSql(passwords));
  writeFileSync(credOut, JSON.stringify(PERSONAS.map((p) => ({ key: p.key, email: p.email, role: p.role, password: passwords[p.key] })), null, 2), { mode: 0o600 });
  console.log(`persona SQL -> ${sqlOut}\ncredentials -> ${credOut} (not committed; deliver out of band)`);
} else {
  const out = resolve(__dirname, "../../supabase/preview/company-os-demo.sql");
  writeFileSync(out, buildDemoSeedSql());
  console.log(`wrote ${out}`);
}
