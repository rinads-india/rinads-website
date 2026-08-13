/**
 * Database access boundary (Phase 0).
 * Schema and migrations live under /supabase — not in this package.
 * No live connection, credentials, or queries in Phase 0.
 */

export type DatabaseConfig = {
  url?: string;
  anonKey?: string;
  /** Server-only. Never ship to the browser. */
  serviceRoleKey?: string;
};

/** Opaque future client placeholder — implement with Supabase in Phase 1+. */
export type DatabaseClient = {
  readonly configured: boolean;
};

export function createDatabaseClient(_config: DatabaseConfig = {}): DatabaseClient {
  return { configured: false };
}
