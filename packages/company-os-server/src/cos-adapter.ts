import type { DbResult, Filter, FilterValue, Row, RowDb, SelectOptions } from "./db";

/**
 * Binds the Company OS engine's logical model to the Company OS v1 Business Graph (`cos_*` tables).
 *
 * The engine (tools, fact loaders, pages) speaks a small logical vocabulary — `crm_companies`,
 * `finance_invoices`, `operational_tasks`, … — whose statuses and column names were designed around the
 * governed lifecycle. The system of record is the kernel's `cos_*` tables (PR #129). This adapter is the
 * only place that knows both, so storage can evolve without touching business logic:
 *
 *   - table names           crm_companies → cos_companies, finance_invoices → cos_invoices, …
 *   - renamed columns       finance_invoices.total → cos_invoices.amount, …
 *   - status vocabularies   invoice "issued" ⇄ "sent", task "completed" ⇄ "done", …
 *   - person references     owner_id / assignee_id carry a cos_workers id
 *
 * It never widens access: every call goes straight to the wrapped (RLS-bound) RowDb. An unknown logical
 * column is a programming error and throws, so a typo can never silently write the wrong field.
 */

type ValueMap = {
  /** Value written to the database for a logical value. */
  to(v: unknown): unknown;
  /** Logical value for a stored value. */
  from(v: unknown): unknown;
  /** Every stored value that reads back as this logical value (used for filters). */
  set(v: unknown): unknown[];
};

function enumMap(toPhysical: Record<string, string>, fromPhysical: Record<string, string>): ValueMap {
  return {
    to: (v) => (typeof v === "string" ? (toPhysical[v] ?? v) : v),
    from: (v) => (typeof v === "string" ? (fromPhysical[v] ?? v) : v),
    set: (v) => {
      if (typeof v !== "string") return [v];
      const out = new Set<string>([toPhysical[v] ?? v]);
      for (const [physical, logical] of Object.entries(fromPhysical)) if (logical === v) out.add(physical);
      return [...out];
    },
  };
}

const RELATIONSHIP = enumMap(
  { prospect: "lead", client: "client", partner: "partner", churned: "churned" },
  { lead: "prospect", qualified: "prospect", opportunity: "prospect", client: "client", partner: "partner", churned: "churned" }
);
const OPP_STAGE = enumMap({}, { discover: "discovery", qualify: "discovery", contract: "negotiation" });
const PROPOSAL_STATUS = enumMap({}, { viewed: "sent" });
const CONTRACT_STATUS = enumMap({}, { active: "signed", completed: "signed" });
const PROJECT_STATUS = enumMap({}, { at_risk: "active" });
const MILESTONE_STATUS = enumMap(
  { pending: "planned", in_progress: "active", done: "completed" },
  { planned: "pending", active: "in_progress", completed: "done", missed: "pending" }
);
const TASK_STATUS = enumMap({ blocked: "waiting", completed: "done" }, { waiting: "blocked", done: "completed", review: "in_progress" });
const TASK_PRIORITY = enumMap({ urgent: "critical" }, { critical: "urgent" });
const INVOICE_STATUS = enumMap({ issued: "sent", partially_paid: "partial" }, { sent: "issued", partial: "partially_paid", overdue: "issued" });

type Col = string | { col: string; map?: ValueMap };
type Entity = { table: string; columns: Record<string, Col> };

const id = (...names: string[]): Record<string, Col> => Object.fromEntries(names.map((n) => [n, n]));
const BASE = ["id", "organization_id", "created_at", "updated_at"];

export const COS_ENTITIES: Record<string, Entity> = {
  crm_companies: {
    table: "cos_companies",
    columns: { ...id(...BASE, "name", "priority", "industry", "website", "company_size", "notes", "created_by"), relationship: { col: "lifecycle_stage", map: RELATIONSHIP }, owner_id: "owner_worker_id" },
  },
  crm_contacts: {
    table: "cos_contacts",
    columns: { ...id(...BASE, "company_id", "full_name", "email", "phone", "is_primary", "notes", "created_by"), role_title: "title" },
  },
  crm_leads: {
    table: "cos_leads",
    columns: {
      ...id(...BASE, "email", "phone", "company_name", "status", "source", "source_ref", "problem", "budget", "timeline", "last_contacted_at", "disqualified_reason", "converted_company_id", "converted_contact_id", "converted_opportunity_id", "created_by"),
      name: "title",
      owner_id: "owner_worker_id",
    },
  },
  crm_opportunities: {
    table: "cos_opportunities",
    columns: {
      ...id(...BASE, "company_id", "contact_id", "title", "kind", "amount", "currency", "probability", "expected_close_date", "stage_changed_at", "lost_reason", "notes", "created_by"),
      stage: { col: "stage", map: OPP_STAGE },
      owner_id: "owner_worker_id",
    },
  },
  crm_proposals: {
    table: "cos_proposals",
    columns: { ...id(...BASE, "opportunity_id", "company_id", "title", "amount", "currency", "valid_until", "sent_at", "document_ref", "sent_action_id", "created_by"), status: { col: "status", map: PROPOSAL_STATUS } },
  },
  crm_contracts: {
    table: "cos_contracts",
    columns: {
      ...id(...BASE, "company_id", "opportunity_id", "proposal_id", "title", "currency", "start_date", "end_date", "signed_at", "signed_by_name", "document_ref", "sign_action_id", "created_by"),
      status: { col: "status", map: CONTRACT_STATUS },
      contract_value: "value",
    },
  },
  projects: {
    table: "cos_projects",
    columns: {
      ...id(...BASE, "company_id", "contract_id", "service_order_id", "name", "kind", "description", "start_date", "due_date", "budget", "currency", "created_by"),
      status: { col: "status", map: PROJECT_STATUS },
      owner_id: "owner_worker_id",
    },
  },
  project_milestones: {
    table: "cos_milestones",
    columns: { ...id(...BASE, "project_id", "name", "due_date", "completed_at", "sort_order", "created_by"), status: { col: "status", map: MILESTONE_STATUS } },
  },
  // The Company OS work engine. Business OS tenants keep the original operational_tasks table untouched.
  operational_tasks: {
    table: "cos_tasks",
    columns: {
      ...id(...BASE, "title", "description", "due_at", "project_id", "milestone_id", "company_id", "estimate_hours", "required_skills", "blocked_by", "completed_at", "created_by"),
      status: { col: "status", map: TASK_STATUS },
      priority: { col: "priority", map: TASK_PRIORITY },
      assignee_id: "assignee_worker_id",
    },
  },
  deliverables: {
    table: "cos_deliverables",
    columns: id(...BASE, "project_id", "milestone_id", "company_id", "task_id", "title", "status", "due_date", "submitted_at", "approved_at", "approved_by", "change_requests", "notes", "created_by"),
  },
  finance_invoices: {
    table: "cos_invoices",
    columns: {
      ...id(...BASE, "number", "company_id", "project_id", "contract_id", "subtotal", "tax_total", "currency", "line_items", "notes", "issue_action_id", "void_action_id", "created_by"),
      status: { col: "status", map: INVOICE_STATUS },
      total: "amount",
      issue_date: "issued_at",
      due_date: "due_at",
    },
  },
  finance_payments: {
    table: "cos_payments",
    columns: { ...id("id", "organization_id", "created_at", "invoice_id", "company_id", "amount", "currency", "method", "reference", "approved_action_id", "recorded_by"), received_at: "paid_at" },
  },
  expenses: {
    table: "cos_expenses",
    columns: { ...id("id", "organization_id", "created_at", "amount", "currency", "category", "notes", "department_id"), expense_date: "incurred_at" },
  },
  people_profiles: {
    table: "cos_workers",
    columns: { ...id(...BASE, "user_id", "display_name", "role_title", "department_id"), status: "profile_status", skills: "skill_levels", weekly_capacity_hours: "available_hours_week" },
  },
};

const colOf = (spec: Col) => (typeof spec === "string" ? { col: spec, map: undefined } : { col: spec.col, map: spec.map });

function physicalColumn(entity: Entity, logical: string, name: string): { col: string; map?: ValueMap } {
  const spec = entity.columns[logical];
  if (!spec) throw new Error(`Company OS adapter: "${logical}" is not a known column of ${name}`);
  return colOf(spec);
}

function toPhysicalRow(entity: Entity, name: string, row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const { col, map } = physicalColumn(entity, k, name);
    out[col] = map ? map.to(v) : v;
  }
  return out;
}

function toLogicalRow(entity: Entity, row: Row): Row {
  const out: Row = {};
  for (const [logical, spec] of Object.entries(entity.columns)) {
    const { col, map } = colOf(spec);
    if (col in row) out[logical] = map ? map.from(row[col]) : row[col];
  }
  return out;
}

function toPhysicalFilter(entity: Entity, name: string, where: Filter | undefined): Filter | undefined {
  if (!where) return where;
  const out: Filter = {};
  for (const [k, v] of Object.entries(where)) {
    const { col, map } = physicalColumn(entity, k, name);
    if (!map) {
      out[col] = v;
      continue;
    }
    if (v !== null && typeof v === "object") {
      if ("in" in v) out[col] = { in: [...new Set(v.in.flatMap((x) => map.set(x)))] };
      else if ("neq" in v) throw new Error(`Company OS adapter: "neq" on ${name}.${k} is not supported (mapped status)`);
      else out[col] = v as FilterValue;
      continue;
    }
    const set = map.set(v);
    out[col] = set.length > 1 ? { in: set } : (set[0] as FilterValue);
  }
  return out;
}

function toPhysicalColumns(entity: Entity, name: string, columns: string | undefined): string {
  if (!columns || columns.trim() === "*") return "*";
  return columns
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => physicalColumn(entity, c, name).col)
    .join(",");
}

function mapResult(entity: Entity, res: DbResult): DbResult {
  return res.error ? res : { data: res.data.map((r) => toLogicalRow(entity, r)), error: null };
}

/** Wrap an RLS-bound RowDb so the engine's logical tables resolve to the cos_* Business Graph. */
export function createCosRowDb(inner: RowDb): RowDb {
  return {
    async select(table, options: SelectOptions = {}) {
      const entity = COS_ENTITIES[table];
      if (!entity) return inner.select(table, options);
      const res = await inner.select(entity.table, {
        columns: toPhysicalColumns(entity, table, options.columns),
        where: toPhysicalFilter(entity, table, options.where),
        order: options.order?.map((o) => ({ column: physicalColumn(entity, o.column, table).col, ascending: o.ascending })),
        limit: options.limit,
      });
      return mapResult(entity, res);
    },
    async insert(table, rows) {
      const entity = COS_ENTITIES[table];
      if (!entity) return inner.insert(table, rows);
      const list = Array.isArray(rows) ? rows : [rows];
      return mapResult(entity, await inner.insert(entity.table, list.map((r) => toPhysicalRow(entity, table, r))));
    },
    async update(table, patch, where) {
      const entity = COS_ENTITIES[table];
      if (!entity) return inner.update(table, patch, where);
      return mapResult(entity, await inner.update(entity.table, toPhysicalRow(entity, table, patch), toPhysicalFilter(entity, table, where) ?? {}));
    },
  };
}
