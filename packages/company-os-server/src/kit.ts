import {
  buildBusinessEvent,
  type BusinessEventInsert,
  type CompanyOsEventType,
  type DomainTool,
  type ToolContext,
} from "@rinads/company-os-engine";
import { isMissingSchema, type Filter, type Row, type RowDb } from "./db";
import { InputError, type Input } from "./validate";

export type SiteLeadRow = {
  id: string;
  name: string;
  work_email: string | null;
  company: string | null;
  problem: string | null;
  budget: string | null;
  timeline: string | null;
  outcome: string | null;
  created_at: string;
};

/** Source of website form leads. Implemented server-side with the (read-only) service credential; absent ⇒ fail closed. */
export interface SiteLeadSource {
  fetchRecent(limit: number): Promise<SiteLeadRow[]>;
}

export type Env = {
  db: RowDb;
  now: () => Date;
  siteLeads?: SiteLeadSource;
};

/** A definite, pre-write failure (nothing was changed). */
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly errorClass: string = "validation_error"
  ) {
    super(message);
    this.name = "ToolError";
  }
}

/** A failure AFTER at least one write: the pipeline must mark the action uncertain. */
export class PartialWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartialWriteError";
  }
}

export type ToolOutput = Record<string, unknown>;

export type ToolSpec = {
  key: string;
  run(ctx: ToolContext, input: Input, env: Env): Promise<ToolOutput>;
  /** Re-read business state and confirm it. Throw ToolError (or return {ok:false}) on mismatch. */
  verify(ctx: ToolContext, input: Input, output: ToolOutput, env: Env): Promise<string | void>;
  events?(ctx: ToolContext, input: Input, output: ToolOutput): BusinessEventInsert[];
};

export function defineTool(spec: ToolSpec, env: Env): DomainTool {
  return {
    key: spec.key,
    async execute(ctx, input) {
      try {
        return { ok: true, output: await spec.run(ctx, input, env) };
      } catch (e) {
        if (e instanceof InputError) return { ok: false, error: e.message, errorClass: "validation_error" };
        if (e instanceof ToolError) return { ok: false, error: e.message, errorClass: e.errorClass };
        throw e; // unknown / partial-write errors are surfaced as UNCERTAIN by the pipeline
      }
    },
    async verify(ctx, input, output) {
      try {
        const detail = await spec.verify(ctx, input, output, env);
        return { ok: true, detail: detail ?? undefined };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Verification failed" };
      }
    },
    events: spec.events ? (ctx, input, output) => spec.events!(ctx, input, output) : undefined,
  };
}

/** Domain event authored by the executing session user (what the database accepts). */
export function evt(
  ctx: ToolContext,
  type: CompanyOsEventType,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown> = {}
): BusinessEventInsert {
  return buildBusinessEvent({
    organizationId: ctx.organizationId,
    type,
    aggregateType,
    aggregateId,
    payload: { ...payload, actionId: ctx.actionId, requestedBy: ctx.requestedBy.kind === "user" ? ctx.requestedBy.userId : ctx.requestedBy.kind === "agent" ? `agent:${ctx.requestedBy.agentRole}` : "system" },
    actor: { kind: "user", userId: ctx.executorUserId },
    correlationId: ctx.correlationId,
    idempotencyKey: `${type}:${aggregateId}:${ctx.actionId}`,
  });
}

// ── small data helpers ────────────────────────────────────────────────────────

export function schemaMessage(error: { message: string; code?: string }): string {
  return isMissingSchema(error)
    ? "The Company OS database schema has not been applied to this environment yet (migrations pending)."
    : error.message;
}

export async function readOne(env: Env, table: string, org: string, id: string, columns = "*"): Promise<Row | null> {
  const { data, error } = await env.db.select(table, { columns, where: { id, organization_id: org }, limit: 1 });
  if (error) throw new ToolError(schemaMessage(error), isMissingSchema(error) ? "schema_pending" : "read_error");
  return data[0] ?? null;
}

export async function mustRead(env: Env, table: string, org: string, id: string, label: string, columns = "*"): Promise<Row> {
  const row = await readOne(env, table, org, id, columns);
  if (!row) throw new ToolError(`${label} not found in this organisation`, "not_found");
  return row;
}

export async function readMany(env: Env, table: string, where: Filter, columns = "*", limit = 1000): Promise<Row[]> {
  const { data, error } = await env.db.select(table, { columns, where, limit });
  if (error) throw new ToolError(schemaMessage(error), isMissingSchema(error) ? "schema_pending" : "read_error");
  return data;
}

export async function insertOne(env: Env, table: string, row: Row): Promise<Row> {
  const { data, error } = await env.db.insert(table, row);
  if (error) throw new ToolError(schemaMessage(error), error.code === "23505" ? "conflict" : isMissingSchema(error) ? "schema_pending" : "write_rejected");
  if (!data[0]) throw new ToolError("Write returned no row (not permitted by row-level security)", "write_rejected");
  return data[0];
}

export async function updateOne(env: Env, table: string, org: string, id: string, patch: Row, extraWhere: Filter = {}): Promise<Row> {
  const { data, error } = await env.db.update(table, patch, { id, organization_id: org, ...extraWhere });
  if (error) throw new ToolError(schemaMessage(error), isMissingSchema(error) ? "schema_pending" : "write_rejected");
  if (!data[0]) throw new ToolError("Update affected no row (not permitted, not found, or changed concurrently)", "write_rejected");
  return data[0];
}

/** After a write has happened, any further failure must be reported as uncertain. */
export async function afterWrite<T>(fn: () => Promise<T>, what: string): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new PartialWriteError(`${what} failed after an earlier step was written: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function same(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (typeof b === "number" || typeof a === "number") return Number(a) === Number(b);
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
  if (typeof a === "string" && typeof b === "string" && /^\d{4}-\d{2}-\d{2}/.test(a) && /^\d{4}-\d{2}-\d{2}/.test(b)) {
    return a.slice(0, 10) === b.slice(0, 10) || new Date(a).getTime() === new Date(b).getTime();
  }
  return String(a) === String(b);
}

/** Re-read a row and confirm each expected field. This is the generic postcondition. */
export async function verifyRow(env: Env, table: string, org: string, id: string, expect: Record<string, unknown>): Promise<Row> {
  const row = await readOne(env, table, org, id);
  if (!row) throw new ToolError(`${table} row ${id} not found after write`, "verification_error");
  for (const [k, v] of Object.entries(expect)) {
    if (!same(row[k], v)) throw new ToolError(`${table}.${k} is ${JSON.stringify(row[k])}, expected ${JSON.stringify(v)}`, "verification_error");
  }
  return row;
}

export const todayIso = (env: Env): string => env.now().toISOString().slice(0, 10);
export const nowIso = (env: Env): string => env.now().toISOString();
