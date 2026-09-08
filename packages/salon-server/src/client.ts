export type SalonRow = Record<string, unknown>;
export type SalonDbError = { message: string };

/**
 * Minimal Supabase client surface this package depends on. Kept small and
 * structurally compatible with `@supabase/supabase-js` (its query builder
 * methods are themselves thenable, so `.eq(...)` and `.single()` calls below
 * can be awaited directly against a real client).
 */
export type SalonSupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (col: string, val: string | boolean) => Promise<{ data: SalonRow[] | null; error: SalonDbError | null }>;
    };
    insert: (row: SalonRow) => {
      select: (columns?: string) => {
        single: () => Promise<{ data: SalonRow | null; error: SalonDbError | null }>;
      };
    };
    update: (row: SalonRow) => {
      eq: (col: string, val: string | boolean) => Promise<{ error: SalonDbError | null }>;
    };
  };
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: SalonDbError | null }>;
};
