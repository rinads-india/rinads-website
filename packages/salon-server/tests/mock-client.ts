import type { SalonRow, SalonSupabaseClient } from "../src/client";

type Filter = { col: string; op: "eq" | "neq" | "in" | "gte" | "lte" | "lt" | "gt" | "is"; val: unknown };

function matches(row: SalonRow, filters: Filter[]): boolean {
  return filters.every((f) => {
    const rowVal = row[f.col];
    switch (f.op) {
      case "eq":
        return rowVal === f.val;
      case "neq":
        return rowVal !== f.val;
      case "in":
        return Array.isArray(f.val) && f.val.includes(rowVal);
      case "gte":
        return (rowVal as number) >= (f.val as number);
      case "lte":
        return (rowVal as number) <= (f.val as number);
      case "lt":
        return (rowVal as number) < (f.val as number);
      case "gt":
        return (rowVal as number) > (f.val as number);
      case "is":
        return rowVal === f.val;
      default:
        return true;
    }
  });
}

/**
 * A generic, dependency-free in-memory Postgrest-shaped mock — supports
 * the subset of chain calls `SalonRepository` actually issues (select
 * with multi-filter/order/limit, insert, upsert with
 * onConflict+ignoreDuplicates, update, delete), so Phase D's POS/refund/
 * notes methods can be exercised without a real Supabase instance. Not a
 * full RLS simulator — RLS itself is asserted statically against the
 * migration SQL (see apps/website/tests/salon-phase-d-migration.test.ts).
 */
export function createSalonMockClient(): SalonSupabaseClient & { tables: Map<string, SalonRow[]> } {
  const tables = new Map<string, SalonRow[]>();
  let seq = 0;

  function getTable(name: string): SalonRow[] {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  }

  function builder(table: string) {
    let op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
    let payload: SalonRow[] = [];
    let upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};
    const filters: Filter[] = [];
    let orderCol: string | null = null;
    let orderAsc = true;
    let limitN: number | null = null;

    function execute(): { data: SalonRow[] | null; error: { message: string } | null } {
      const rows = getTable(table);
      if (op === "select") {
        let result = rows.filter((r) => matches(r, filters));
        if (orderCol) {
          const col = orderCol;
          result = [...result].sort((a, b) => {
            const av = a[col] as string | number;
            const bv = b[col] as string | number;
            return orderAsc ? (av > bv ? 1 : av < bv ? -1 : 0) : av > bv ? -1 : av < bv ? 1 : 0;
          });
        }
        if (limitN !== null) result = result.slice(0, limitN);
        return { data: result, error: null };
      }
      if (op === "insert") {
        const inserted = payload.map((row) => {
          const now = new Date().toISOString();
          const stored: SalonRow = { id: `${table}_${++seq}`, created_at: now, updated_at: now, ...row };
          rows.push(stored);
          return stored;
        });
        return { data: inserted, error: null };
      }
      if (op === "upsert") {
        const conflictCols = upsertOpts.onConflict ? upsertOpts.onConflict.split(",") : ["id"];
        const results: SalonRow[] = [];
        for (const row of payload) {
          const existingIdx = rows.findIndex((r) => conflictCols.every((c) => r[c] === row[c]));
          if (existingIdx >= 0) {
            if (!upsertOpts.ignoreDuplicates) {
              rows[existingIdx] = { ...rows[existingIdx], ...row, updated_at: new Date().toISOString() };
            }
            results.push(rows[existingIdx]);
          } else {
            const now = new Date().toISOString();
            const stored: SalonRow = { id: row.id ? String(row.id) : `${table}_${++seq}`, created_at: now, updated_at: now, ...row };
            rows.push(stored);
            results.push(stored);
          }
        }
        return { data: results, error: null };
      }
      if (op === "update") {
        const patch = payload[0] ?? {};
        const matched = rows.filter((r) => matches(r, filters));
        for (const row of matched) Object.assign(row, patch, { updated_at: new Date().toISOString() });
        return { data: matched, error: matched.length ? null : { message: "Not found" } };
      }
      if (op === "delete") {
        const remaining = rows.filter((r) => !matches(r, filters));
        const removedCount = rows.length - remaining.length;
        tables.set(table, remaining);
        return { data: [], error: removedCount ? null : { message: "Not found" } };
      }
      return { data: null, error: { message: `Unsupported op: ${op}` } };
    }

    const api = {
      select() {
        return api;
      },
      insert(row: SalonRow | SalonRow[]) {
        op = "insert";
        payload = Array.isArray(row) ? row : [row];
        return api;
      },
      upsert(row: SalonRow | SalonRow[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
        op = "upsert";
        payload = Array.isArray(row) ? row : [row];
        upsertOpts = opts ?? {};
        return api;
      },
      update(row: SalonRow) {
        op = "update";
        payload = [row];
        return api;
      },
      delete() {
        op = "delete";
        return api;
      },
      eq(col: string, val: unknown) {
        filters.push({ col, op: "eq", val });
        return api;
      },
      neq(col: string, val: unknown) {
        filters.push({ col, op: "neq", val });
        return api;
      },
      in(col: string, vals: unknown[]) {
        filters.push({ col, op: "in", val: vals });
        return api;
      },
      gte(col: string, val: unknown) {
        filters.push({ col, op: "gte", val });
        return api;
      },
      lte(col: string, val: unknown) {
        filters.push({ col, op: "lte", val });
        return api;
      },
      lt(col: string, val: unknown) {
        filters.push({ col, op: "lt", val });
        return api;
      },
      gt(col: string, val: unknown) {
        filters.push({ col, op: "gt", val });
        return api;
      },
      is(col: string, val: unknown) {
        filters.push({ col, op: "is", val });
        return api;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderCol = col;
        orderAsc = opts?.ascending ?? true;
        return api;
      },
      limit(n: number) {
        limitN = n;
        return api;
      },
      async single() {
        const { data, error } = execute();
        if (error) return { data: null, error };
        if (!data || data.length !== 1) return { data: null, error: { message: "Row not found or not unique" } };
        return { data: data[0], error: null };
      },
      async maybeSingle() {
        const { data, error } = execute();
        if (error) return { data: null, error: null };
        return { data: data && data.length ? data[0] : null, error: null };
      },
      then(resolve: (v: { data: SalonRow[] | null; error: { message: string } | null }) => void) {
        resolve(execute());
      },
    };
    return api;
  }

  return {
    tables,
    from(table: string) {
      return builder(table) as unknown as ReturnType<SalonSupabaseClient["from"]>;
    },
    rpc: async () => ({ data: null, error: { message: "rpc not stubbed in this mock" } }),
  } as unknown as SalonSupabaseClient & { tables: Map<string, SalonRow[]> };
}
