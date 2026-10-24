import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const migrationPattern = /^(\d{14})_([A-Za-z0-9][A-Za-z0-9_-]*)\.sql$/;

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const invalidNames = [];
const byVersion = new Map();
const caseFoldedNames = new Map();

for (const file of files) {
  const match = migrationPattern.exec(file);
  if (!match) {
    invalidNames.push(file);
    continue;
  }

  const version = match[1];
  const versionFiles = byVersion.get(version) ?? [];
  versionFiles.push(file);
  byVersion.set(version, versionFiles);

  const folded = file.toLowerCase();
  const foldedFiles = caseFoldedNames.get(folded) ?? [];
  foldedFiles.push(file);
  caseFoldedNames.set(folded, foldedFiles);
}

const duplicateVersions = [...byVersion.entries()].filter(([, names]) => names.length > 1);
const caseCollisions = [...caseFoldedNames.entries()]
  .map(([, names]) => names)
  .filter((names) => names.length > 1);

if (invalidNames.length || duplicateVersions.length || caseCollisions.length) {
  console.error("Migration safety guard failed.");

  if (invalidNames.length) {
    console.error("\nInvalid migration filenames (expected YYYYMMDDHHMMSS_description.sql):");
    for (const name of invalidNames) console.error(`  - ${name}`);
  }

  if (duplicateVersions.length) {
    console.error("\nDuplicate migration versions detected:");
    for (const [version, names] of duplicateVersions) {
      console.error(`  - ${version}`);
      for (const name of names) console.error(`      ${name}`);
    }
    console.error("\nNever reuse a migration version for different schema changes. Create a new unique timestamp instead.");
  }

  if (caseCollisions.length) {
    console.error("\nCase-insensitive migration filename collisions detected:");
    for (const names of caseCollisions) console.error(`  - ${names.join(" | ")}`);
  }

  process.exit(1);
}

console.log(`Migration safety guard passed: ${files.length} SQL migrations, ${byVersion.size} unique versions.`);
