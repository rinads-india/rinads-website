import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, it } from "node:test";

const REPO_ROOT = join(process.cwd(), "../..");
const MIGRATIONS_DIR = join(REPO_ROOT, "supabase/migrations");

function normalize(path: string): string {
  return path.split(sep).join("/");
}

function migrationSql(): Array<{ file: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({ file, sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8") }));
}

function countCreateTable(sql: string, table: string): number {
  const pattern = new RegExp(
    `\\bcreate\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?${table}\\b`,
    "gi",
  );
  return [...sql.matchAll(pattern)].length;
}

function sourceFiles(root: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "dist", "coverage", "tests", "test", "fixtures"].includes(entry)) continue;
      output.push(...sourceFiles(full));
      continue;
    }
    if (!/\.(?:ts|tsx|js|jsx)$/.test(entry)) continue;
    if (/\.(?:test|spec)\./.test(entry)) continue;
    output.push(full);
  }
  return output;
}

describe("platform kernel architecture contract", () => {
  it("keeps canonical shared tables single-owned in the migration ledger", () => {
    const migrations = migrationSql();
    const protectedTables = [
      "organizations",
      "organization_members",
      "roles",
      "permissions",
      "role_permissions",
      "audit_logs",
      "business_events",
      "notification_outbox",
      "payment_webhook_events",
    ];

    for (const table of protectedTables) {
      const owners = migrations
        .map(({ file, sql }) => ({ file, count: countCreateTable(sql, table) }))
        .filter(({ count }) => count > 0);
      const total = owners.reduce((sum, owner) => sum + owner.count, 0);

      assert.equal(
        total,
        1,
        `${table} must have exactly one canonical CREATE TABLE owner; found ${owners
          .map((owner) => `${owner.file}(${owner.count})`)
          .join(", ") || "none"}`,
      );
    }
  });

  it("does not allow new direct variant.stock mutation sites", () => {
    const allowedCompatibilityMutations = new Set([
      "packages/commerce/src/services/checkout.ts",
      "packages/operations-server/src/seed.ts",
    ]);

    const mutationPattern = /\bvariant\.stock\s*(?:=|\+=|-=|\*=|\/=|\+\+|--)/g;
    const roots = [join(REPO_ROOT, "apps"), join(REPO_ROOT, "packages")];
    const mutationSites: string[] = [];

    for (const root of roots) {
      for (const file of sourceFiles(root)) {
        const source = readFileSync(file, "utf8");
        if (!mutationPattern.test(source)) continue;
        mutationPattern.lastIndex = 0;
        mutationSites.push(normalize(relative(REPO_ROOT, file)));
      }
    }

    const unexpected = mutationSites.filter((site) => !allowedCompatibilityMutations.has(site));
    assert.deepEqual(
      unexpected,
      [],
      `new direct variant.stock mutation bypasses the inventory ledger contract: ${unexpected.join(", ")}`,
    );
  });

  it("documents scalar variant stock as a compatibility projection, not authority", () => {
    const contract = readFileSync(join(REPO_ROOT, "docs/architecture/PLATFORM-KERNEL-CONTRACT.md"), "utf8");
    const adr = readFileSync(join(REPO_ROOT, "docs/decisions/ADR-013-platform-kernel-canonicalization.md"), "utf8");

    assert.match(contract, /product_variants\.stock[\s\S]*projection/i);
    assert.match(contract, /stock_movements[\s\S]*reservations/i);
    assert.match(adr, /product_variants\.stock[\s\S]*compatibility\/read projection/i);
  });

  it("locks organization as tenant boundary while allowing additive workspace/location scope", () => {
    const adr = readFileSync(join(REPO_ROOT, "docs/decisions/ADR-013-platform-kernel-canonicalization.md"), "utf8");

    assert.match(adr, /organization_id[\s\S]*mandatory tenant boundary/i);
    assert.match(adr, /Organization\s*\n\s*-> Workspace/i);
    assert.match(adr, /Existing tables are not mass-rewritten/i);
  });
});
