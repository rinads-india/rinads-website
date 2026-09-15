export type SalonRow = Record<string, unknown>;
export type SalonDbError = { message: string };
export type SalonQueryResult<T = SalonRow[]> = Promise<{ data: T | null; error: SalonDbError | null }>;
export type SalonSingleResult<T = SalonRow> = Promise<{ data: T | null; error: SalonDbError | null }>;

/**
 * Minimal Supabase client surface this package depends on. Kept
 * structurally compatible with `@supabase/supabase-js` (its query builder
 * methods are themselves thenable/chainable, so any subset of
 * `.eq()`/`.in()`/`.gte()`/`.order()`/`.single()` calls below can be awaited
 * directly against a real client cast through this type).
 *
 * `SalonQueryBuilder` is intentionally permissive (every filter/modifier
 * returns another builder, and the builder itself resolves like a promise)
 * because the real postgrest-js builder supports many chain orders; a fully
 * exhaustive structural type isn't worth the maintenance cost when every
 * call site already goes through an explicit `as unknown as
 * SalonSupabaseClient` cast at the app boundary.
 */
export type SalonQueryBuilder = {
  select: (columns?: string) => SalonQueryBuilder;
  insert: (row: SalonRow | SalonRow[]) => SalonQueryBuilder;
  upsert: (row: SalonRow | SalonRow[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => SalonQueryBuilder;
  update: (row: SalonRow) => SalonQueryBuilder;
  delete: () => SalonQueryBuilder;
  eq: (col: string, val: unknown) => SalonQueryBuilder;
  neq: (col: string, val: unknown) => SalonQueryBuilder;
  in: (col: string, vals: unknown[]) => SalonQueryBuilder;
  gte: (col: string, val: unknown) => SalonQueryBuilder;
  lte: (col: string, val: unknown) => SalonQueryBuilder;
  lt: (col: string, val: unknown) => SalonQueryBuilder;
  gt: (col: string, val: unknown) => SalonQueryBuilder;
  is: (col: string, val: unknown) => SalonQueryBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => SalonQueryBuilder;
  limit: (n: number) => SalonQueryBuilder;
  single: () => SalonSingleResult;
  maybeSingle: () => SalonSingleResult;
} & SalonQueryResult;

export type SalonSupabaseClient = {
  from: (table: string) => SalonQueryBuilder;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: SalonDbError | null }>;
};
