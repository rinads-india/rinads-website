/**
 * RowDb — the only data-access seam the Company OS server code uses.
 *
 * Production: `createSupabaseRowDb(client)` over the CALLER'S RLS-bound Supabase session.
 * There is deliberately no service-role implementation in this package: every read and write is
 * evaluated by Postgres RLS as the signed-in user, so a bug here cannot widen access.
 * Tests: an in-process Postgres implements the same interface (tests/pg-rowdb.ts).
 */

export type Row = Record<string, unknown>;
export type DbError = { message: string; code?: string };
export type DbResult<T = Row> = { data: T[]; error: DbError | null };

export type FilterValue =
  | string
  | number
  | boolean
  | null
  | { in: readonly unknown[] }
  | { neq: unknown }
  | { gte: unknown }
  | { lt: unknown }
  | { lte: unknown }
  | { notNull: true };

export type Filter = Record<string, FilterValue>;

export type SelectOptions = {
  columns?: string;
  where?: Filter;
  order?: { column: string; ascending?: boolean }[];
  limit?: number;
};

export interface RowDb {
  select(table: string, options?: SelectOptions): Promise<DbResult>;
  insert(table: string, rows: Row | Row[]): Promise<DbResult>;
  update(table: string, patch: Row, where: Filter): Promise<DbResult>;
}

const IDENT = /^[a-z_][a-z0-9_]*$/;
export function assertIdent(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Unsafe identifier: ${name}`);
  return name;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function applyFilter(query: any, where: Filter | undefined): any {
  let q = query;
  for (const [column, value] of Object.entries(where ?? {})) {
    assertIdent(column);
    if (value === null) q = q.is(column, null);
    else if (typeof value === "object") {
      if ("in" in value) q = q.in(column, [...value.in]);
      else if ("neq" in value) q = q.neq(column, value.neq);
      else if ("gte" in value) q = q.gte(column, value.gte);
      else if ("lt" in value) q = q.lt(column, value.lt);
      else if ("lte" in value) q = q.lte(column, value.lte);
      else if ("notNull" in value) q = q.not(column, "is", null);
    } else q = q.eq(column, value);
  }
  return q;
}

function toResult(res: { data: any; error: { message: string; code?: string } | null }): DbResult {
  if (res.error) return { data: [], error: { message: res.error.message, code: res.error.code } };
  const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
  return { data, error: null };
}

/** Wraps a supabase-js client created from the user's cookies (anon key + user JWT → RLS applies). */
export function createSupabaseRowDb(client: any): RowDb {
  return {
    async select(table, options = {}) {
      assertIdent(table);
      let q = client.from(table).select(options.columns ?? "*");
      q = applyFilter(q, options.where);
      for (const o of options.order ?? []) q = q.order(assertIdent(o.column), { ascending: o.ascending ?? true });
      if (options.limit) q = q.limit(options.limit);
      return toResult(await q);
    },
    async insert(table, rows) {
      assertIdent(table);
      return toResult(await client.from(table).insert(rows).select());
    },
    async update(table, patch, where) {
      assertIdent(table);
      return toResult(await applyFilter(client.from(table).update(patch), where).select());
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function isMissingSchema(error: DbError | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message);
}

export function isUniqueViolation(error: DbError | null): boolean {
  return !!error && (error.code === "23505" || /duplicate key|unique constraint/i.test(error.message));
}
