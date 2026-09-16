/**
 * Compact in-memory Postgrest-shaped mock, duplicated from
 * `@rinads/salon-server`'s `tests/mock-client.ts` rather than imported —
 * a package's `tests/` directory isn't part of its public surface, so
 * `@rinads/intelligence` (which depends on `@rinads/salon-server` for its
 * real repository/actions/notification classes) keeps its own copy for
 * exercising `salon-tools.ts` end-to-end against those real classes.
 */
import type { SalonRow, SalonSupabaseClient } from "@rinads/salon-server";

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
    rpc: async (fn, args = {}) => {
      if (fn === "salon_loyalty_balance") {
        const account = getTable("salon_loyalty_accounts").find((row) =>
          row.organization_id === args.p_organization_id &&
          row.customer_id === args.p_customer_id
        );
        const balance = account
          ? getTable("salon_loyalty_ledger_entries")
              .filter((row) => row.organization_id === args.p_organization_id && row.account_id === account.id)
              .reduce((sum, row) => sum + Number(row.points ?? 0), 0)
          : 0;
        return { data: balance, error: null };
      }
      if (fn === "salon_loyalty_redeem") {
        const account = getTable("salon_loyalty_accounts").find((row) =>
          row.organization_id === args.p_organization_id &&
          row.customer_id === args.p_customer_id
        );
        if (!account) return { data: null, error: { message: "Loyalty account not found." } };
        const row = {
          id: `salon_loyalty_redemptions_${++seq}`,
          organization_id: args.p_organization_id,
          account_id: account.id,
          sale_id: args.p_sale_id,
          points: args.p_points,
          currency_value: Number(args.p_points ?? 0) / 10,
          status: "processed",
          idempotency_key: args.p_idempotency_key,
        };
        getTable("salon_loyalty_redemptions").push(row);
        return { data: row, error: null };
      }
      if (fn === "salon_loyalty_adjust") {
        const account = getTable("salon_loyalty_accounts").find((row) =>
          row.organization_id === args.p_organization_id &&
          row.customer_id === args.p_customer_id
        );
        if (!account) return { data: null, error: { message: "Loyalty account not found." } };
        const row = {
          id: `salon_loyalty_ledger_entries_${++seq}`,
          organization_id: args.p_organization_id,
          account_id: account.id,
          entry_type: "adjust",
          points: args.p_points,
          reason: args.p_reason,
          idempotency_key: args.p_idempotency_key,
        };
        getTable("salon_loyalty_ledger_entries").push(row);
        return { data: row, error: null };
      }
      if (fn === "retry_salon_notification_outbox") {
        const recipientIds = new Set(
          getTable("salon_campaign_recipients")
            .filter((row) => !args.p_campaign_id || row.campaign_id === args.p_campaign_id)
            .map((row) => row.id)
        );
        const rows = getTable("notification_outbox").filter((row) =>
          row.organization_id === args.p_organization_id &&
          (!args.p_notification_outbox_id || row.id === args.p_notification_outbox_id) &&
          (!args.p_campaign_id || recipientIds.has(row.campaign_recipient_id)) &&
          ["failed", "dead_letter", "not_configured"].includes(String(row.status))
        ).slice(0, Number(args.p_limit ?? 50));
        rows.forEach((row) => Object.assign(row, { status: "pending", attempts: 0, last_error: null, next_attempt_at: null }));
        return { data: { rows, count: rows.length, has_more: false, limit: 1 }, error: null };
      }
      return { data: null, error: { message: `rpc ${fn} not stubbed in this mock` } };
    },
  } as unknown as SalonSupabaseClient & { tables: Map<string, SalonRow[]> };
}
