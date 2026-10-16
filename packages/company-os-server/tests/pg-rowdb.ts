import type { Db, Who } from "../../company-os/tests/db/harness";
import { run } from "../../company-os/tests/db/harness";
import type { DbResult, Filter, Row, RowDb, SelectOptions } from "../src/db";
import { assertIdent } from "../src/db";

/**
 * RowDb over the in-process Postgres that has the REAL migration chain applied.
 * Each call runs as `who` (SET ROLE authenticated + JWT claims) so row-level security,
 * triggers and constraints are exactly what the production database enforces.
 */
export function pgRowDb(db: Db, who: Who): RowDb {
  const kinds = new Map<string, Map<string, { json: boolean }>>();

  async function columnKinds(table: string) {
    let m = kinds.get(table);
    if (!m) {
      const rows = await db.query<{ column_name: string; data_type: string }>("select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1", [table]);
      m = new Map(rows.rows.map((r) => [r.column_name, { json: r.data_type === "jsonb" || r.data_type === "json" }]));
      kinds.set(table, m);
    }
    return m;
  }

  function where(filter: Filter | undefined, params: unknown[]): string {
    const parts: string[] = [];
    for (const [col, v] of Object.entries(filter ?? {})) {
      assertIdent(col);
      if (v === null) parts.push(`${col} is null`);
      else if (typeof v === "object") {
        if ("in" in v) {
          params.push(v.in);
          parts.push(`${col} = any($${params.length})`);
        } else if ("neq" in v) (params.push(v.neq), parts.push(`${col} <> $${params.length}`));
        else if ("gte" in v) (params.push(v.gte), parts.push(`${col} >= $${params.length}`));
        else if ("lt" in v) (params.push(v.lt), parts.push(`${col} < $${params.length}`));
        else if ("lte" in v) (params.push(v.lte), parts.push(`${col} <= $${params.length}`));
        else if ("notNull" in v) parts.push(`${col} is not null`);
      } else {
        params.push(v);
        parts.push(`${col} = $${params.length}`);
      }
    }
    return parts.length ? `where ${parts.join(" and ")}` : "";
  }

  async function exec(sql: string, params: unknown[]): Promise<DbResult> {
    try {
      return { data: await run<Row>(db, who, sql, params), error: null };
    } catch (e) {
      const err = e as { message: string; code?: string };
      return { data: [], error: { message: err.message, code: err.code } };
    }
  }

  async function bind(table: string, row: Row, params: unknown[]): Promise<{ cols: string[]; refs: string[] }> {
    const kind = await columnKinds(table);
    const cols: string[] = [];
    const refs: string[] = [];
    for (const [k, v] of Object.entries(row)) {
      if (v === undefined) continue;
      assertIdent(k);
      cols.push(k);
      params.push(kind.get(k)?.json && v !== null ? JSON.stringify(v) : v);
      refs.push(kind.get(k)?.json ? `$${params.length}::jsonb` : `$${params.length}`);
    }
    return { cols, refs };
  }

  return {
    async select(table: string, o: SelectOptions = {}) {
      assertIdent(table);
      const cols = o.columns ?? "*";
      if (!/^[a-z_*,\s]+$/.test(cols)) throw new Error(`Unsupported column list: ${cols}`);
      const params: unknown[] = [];
      const w = where(o.where, params);
      const order = o.order?.length ? `order by ${o.order.map((x) => `${assertIdent(x.column)} ${x.ascending === false ? "desc" : "asc"}`).join(", ")}` : "";
      return exec(`select ${cols} from public.${table} ${w} ${order} ${o.limit ? `limit ${Number(o.limit)}` : ""}`, params);
    },
    async insert(table: string, rows: Row | Row[]) {
      assertIdent(table);
      const list = Array.isArray(rows) ? rows : [rows];
      const out: Row[] = [];
      for (const row of list) {
        const params: unknown[] = [];
        const { cols, refs } = await bind(table, row, params);
        const res = await exec(`insert into public.${table} (${cols.join(",")}) values (${refs.join(",")}) returning *`, params);
        if (res.error) return res;
        out.push(...res.data);
      }
      return { data: out, error: null };
    },
    async update(table: string, patch: Row, filter: Filter) {
      assertIdent(table);
      const params: unknown[] = [];
      const { cols, refs } = await bind(table, patch, params);
      const set = cols.map((c, i) => `${c} = ${refs[i]}`).join(", ");
      const w = where(filter, params);
      return exec(`update public.${table} set ${set} ${w} returning *`, params);
    },
  };
}
