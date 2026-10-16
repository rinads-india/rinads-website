import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = join(here, "../../../../supabase/migrations");
export const COMPANY_OS_PREFIX = "20261016120";

export const A = { org: "a0000000-0000-4000-8000-00000000000a" };
export const B = { org: "b0000000-0000-4000-8000-00000000000b" };

export const U = {
  founderA: "f0000000-0000-4000-8000-000000000001",
  adminA: "f0000000-0000-4000-8000-000000000002",
  adminA2: "f0000000-0000-4000-8000-000000000003",
  managerA: "f0000000-0000-4000-8000-000000000004",
  staffA: "f0000000-0000-4000-8000-000000000005",
  clientA: "f0000000-0000-4000-8000-000000000006",
  viewerA: "f0000000-0000-4000-8000-000000000007",
  adminB: "f0000000-0000-4000-8000-000000000008",
  staffB: "f0000000-0000-4000-8000-000000000009",
  outsider: "f0000000-0000-4000-8000-00000000000a",
} as const;

export type Who = { uid: string | null; role?: "authenticated" | "anon" | "service_role" };

export type Db = PGlite;

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
}

function sqlOf(file: string): string {
  // pgcrypto is unavailable in the in-process engine; gen_random_uuid() is built in.
  return readFileSync(join(MIGRATIONS_DIR, file), "utf8").replace(/^\s*create extension[^;]*pgcrypto[^;]*;/gim, "-- (pgcrypto stripped for in-process engine)");
}

export async function createDb(options: { stopBeforeCompanyOs?: boolean } = {}): Promise<Db> {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec("create extension if not exists btree_gist;");
  await db.exec(readFileSync(join(here, "supabase-stub.sql"), "utf8"));
  for (const file of migrationFiles()) {
    if (options.stopBeforeCompanyOs && file.startsWith(COMPANY_OS_PREFIX)) break;
    try {
      await db.exec(sqlOf(file));
    } catch (e) {
      throw new Error(`Migration ${file} failed: ${(e as Error).message}`);
    }
  }
  return db;
}

export async function applyCompanyOsMigrations(db: Db): Promise<void> {
  for (const file of migrationFiles().filter((f) => f.startsWith(COMPANY_OS_PREFIX))) {
    try {
      await db.exec(sqlOf(file));
    } catch (e) {
      throw new Error(`Migration ${file} failed: ${(e as Error).message}`);
    }
  }
}

export function companyOsMigrationFiles(): string[] {
  return migrationFiles().filter((f) => f.startsWith(COMPANY_OS_PREFIX));
}

export function readCompanyOsSql(): { file: string; sql: string }[] {
  return companyOsMigrationFiles().map((file) => ({ file, sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8") }));
}

/** Seed two tenants and a spread of roles. Runs as superuser with a service_role JWT (privileged-role trigger). */
export async function seed(db: Db): Promise<void> {
  await db.exec(`select set_config('request.jwt.claims', '{"role":"service_role"}', false);`);
  const users = Object.values(U);
  for (const id of users) {
    await db.query("insert into auth.users (id, email) values ($1, $2) on conflict do nothing", [id, `${id.slice(-2)}@test.local`]);
    await db.query("insert into public.profiles (id, display_name) values ($1, $2) on conflict do nothing", [id, `user-${id.slice(-2)}`]);
  }
  await db.query("insert into public.organizations (id, name, slug) values ($1, 'RINADS A', 'org-a'), ($2, 'Other B', 'org-b') on conflict do nothing", [A.org, B.org]);
  const roles: [string, string, string][] = [
    [A.org, U.founderA, "founder"],
    [A.org, U.adminA, "admin"],
    [A.org, U.adminA2, "admin"],
    [A.org, U.managerA, "manager"],
    [A.org, U.staffA, "staff"],
    [A.org, U.clientA, "client"],
    [A.org, U.viewerA, "viewer"],
    [B.org, U.adminB, "admin"],
    [B.org, U.staffB, "staff"],
  ];
  for (const [org, uid, role] of roles) {
    await db.query(
      "insert into public.organization_members (organization_id, user_id, role_id, status) select $1, $2, r.id, 'active' from public.roles r where r.key = $3 on conflict do nothing",
      [org, uid, role]
    );
  }
  await db.exec(`select set_config('request.jwt.claims', '', false);`);
}

async function withIdentity<T>(db: Db, who: Who, fn: () => Promise<T>, commit: boolean): Promise<T> {
  const role = who.role ?? (who.uid ? "authenticated" : "anon");
  await db.exec("begin");
  try {
    const claims = JSON.stringify({ sub: who.uid ?? "", role });
    await db.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true), set_config('request.jwt.claim.role', $3, true)", [who.uid ?? "", claims, role]);
    await db.exec(`set local role ${role}`);
    const result = await fn();
    await db.exec(commit ? "commit" : "rollback");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}

/** Run one statement as `who` in its own transaction and COMMIT. */
export async function run<T = Record<string, unknown>>(db: Db, who: Who, sql: string, params: unknown[] = []): Promise<T[]> {
  return withIdentity(db, who, async () => (await db.query<T>(sql, params)).rows, true);
}

/** Run one statement as `who` and ROLL BACK (reads, or writes we don't want to keep). */
export async function peek<T = Record<string, unknown>>(db: Db, who: Who, sql: string, params: unknown[] = []): Promise<T[]> {
  return withIdentity(db, who, async () => (await db.query<T>(sql, params)).rows, false);
}

/** Returns the database error message if the statement is rejected, or null if it unexpectedly succeeds. */
export async function denied(db: Db, who: Who, sql: string, params: unknown[] = []): Promise<string | null> {
  try {
    await withIdentity(db, who, async () => (await db.query(sql, params)).rows, false);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

/** Superuser helper for arranging fixtures (bypasses RLS). */
export async function admin<T = Record<string, unknown>>(db: Db, sql: string, params: unknown[] = []): Promise<T[]> {
  await db.exec(`select set_config('request.jwt.claims', '{"role":"service_role"}', false)`);
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec(`select set_config('request.jwt.claims', '', false)`);
  }
}

export const as = {
  founderA: { uid: U.founderA } as Who,
  adminA: { uid: U.adminA } as Who,
  adminA2: { uid: U.adminA2 } as Who,
  managerA: { uid: U.managerA } as Who,
  staffA: { uid: U.staffA } as Who,
  clientA: { uid: U.clientA } as Who,
  viewerA: { uid: U.viewerA } as Who,
  adminB: { uid: U.adminB } as Who,
  staffB: { uid: U.staffB } as Who,
  outsider: { uid: U.outsider } as Who,
  anon: { uid: null, role: "anon" } as Who,
  service: { uid: null, role: "service_role" } as Who,
};
