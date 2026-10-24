#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["apps", "packages", ".github/workflows"];
const sourceFilePattern = /\.(?:[cm]?[jt]sx?|ya?ml)$/i;
const testFilePattern = /\.(?:test|spec)\.[cm]?[jt]sx?$/i;

// Public browser variables are intentionally allowed for values such as
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. These tokens
// identify names that should never be exposed through a NEXT_PUBLIC_* key.
const forbiddenPublicNamePattern =
  /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|PASSWORD|PRIVATE_KEY|DATABASE_URL|CRON_SECRET|ADMIN_KEY|SECRET_KEY|ROOT_KEY|MASTER_KEY)[A-Z0-9_]*\b/g;

async function walk(relativePath) {
  const entries = await readdir(relativePath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(child)));
      continue;
    }

    if (
      entry.isFile() &&
      sourceFilePattern.test(entry.name) &&
      !testFilePattern.test(entry.name)
    ) {
      files.push(child);
    }
  }

  return files;
}

const findings = [];

for (const root of roots) {
  let files;
  try {
    files = await walk(root);
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const matches = lines[index].match(forbiddenPublicNamePattern);
      if (!matches) continue;

      for (const identifier of new Set(matches)) {
        findings.push({ file, line: index + 1, identifier });
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Public environment secret-scope guard failed.");
  console.error(
    "Server-only credentials must never use a NEXT_PUBLIC_* environment name.",
  );
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} -> ${finding.identifier}`);
  }
  process.exit(1);
}

console.log("Public environment secret-scope guard passed.");
