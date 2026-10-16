import {
  MS_PER_DAY,
  available,
  can,
  detectAdSignals,
  istDayBounds,
  istMonthBounds,
  notConnected,
  unavailable,
  type AdDay,
  type AdSignalFact,
  type AiRunFact,
  type ApprovalFact,
  type AssetFact,
  type CampaignFact,
  type CommExceptionFact,
  type CompanyFact,
  type CompanyFacts,
  type ContractFact,
  type DeliverableFact,
  type EngineeringFacts,
  type InvoiceFact,
  type LeadFact,
  type MilestoneFact,
  type OpportunityFact,
  type OrgContext,
  type PaymentFact,
  type PersonCapacity,
  type ProjectFact,
  type ProposalFact,
  type Section,
  type ShipmentFact,
  type SkillLevel,
  type StudioJobFact,
  type TaskFact,
  assetProblems,
  type AssetRecord,
  type ExpenseFact,
  type AlertFact,
} from "@rinads/company-os";
import { isMissingSchema, type DbResult, type Filter, type Row, type RowDb } from "./db";

export const SCHEMA_PENDING =
  "The Company OS database schema has not been applied to this environment yet (migrations pending founder approval).";
const ROW_LIMIT = 1000;
const SHIPMENT_STALE_DAYS = 7;

const iso = (v: unknown): string => new Date(String(v)).toISOString();
const isoOrNull = (v: unknown): string | null => (v ? iso(v) : null);
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const strOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

export type LoadFactsInput = {
  db: RowDb;
  ctx: OrgContext;
  organizationName: string;
  now: Date;
  /** Engineering signals come from external APIs; absent ⇒ every source reads "not connected". */
  engineering?: EngineeringFacts;
};

export async function loadCompanyFacts(input: LoadFactsInput): Promise<{ facts: CompanyFacts; notes: string[] }> {
  const { db, ctx, now } = input;
  const org = ctx.organizationId;
  const asOf = now.toISOString();
  const notes: string[] = [];

  async function section<T>(name: string, permission: string | null, fetch: () => Promise<DbResult | DbResult[]>, map: (rows: Row[]) => T): Promise<Section<T>> {
    if (permission && !can(ctx, permission)) return unavailable(`Your role does not include ${permission}.`);
    try {
      const results = await fetch();
      const list = Array.isArray(results) ? results : [results];
      for (const r of list) {
        if (r.error) return unavailable(isMissingSchema(r.error) ? SCHEMA_PENDING : `${name} could not be read: ${r.error.message}`);
        if (r.data.length >= ROW_LIMIT) notes.push(`${name}: only the first ${ROW_LIMIT} records were read, so counts may be understated.`);
      }
      return available(map(list.flatMap((r) => r.data)), asOf);
    } catch (e) {
      return unavailable(`${name} could not be read: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  const sel = (table: string, where: Filter = {}, columns = "*") => db.select(table, { columns, where: { organization_id: org, ...where }, limit: ROW_LIMIT });

  const day = istDayBounds(now);
  const month = istMonthBounds(now);
  const recent = new Date(now.getTime() - 2 * MS_PER_DAY).toISOString();

  // ── Work (existing task engine; readable by any member) ───────────────────────
  const tasks = await section<TaskFact[]>(
    "Tasks",
    null,
    () => Promise.all([sel("operational_tasks", { status: { in: ["todo", "in_progress", "blocked"] } }), sel("operational_tasks", { status: "completed", updated_at: { gte: recent } })]),
    (rows) =>
      dedupe(rows).map<TaskFact>((r) => ({
        id: String(r.id),
        title: String(r.title),
        status: r.status as TaskFact["status"],
        priority: r.priority as TaskFact["priority"],
        dueAt: isoOrNull(r.due_at),
        assigneeId: strOrNull(r.assignee_id),
        projectId: strOrNull(r.project_id),
        createdAt: iso(r.created_at),
        updatedAt: iso(r.updated_at),
      }))
  );

  const alerts = await section<AlertFact[]>("Operational alerts", null, () => sel("operational_alerts", { acknowledged: false }), (rows) =>
    rows.map((r) => ({ id: String(r.id), title: String(r.title), severity: r.severity as AlertFact["severity"], createdAt: iso(r.created_at) }))
  );

  // ── CRM / sales ───────────────────────────────────────────────────────────────
  const companiesSection = await section<CompanyFact[]>("Companies", "crm.read", () => sel("crm_companies", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), name: String(r.name), relationship: r.relationship as CompanyFact["relationship"], ownerId: strOrNull(r.owner_id), priority: r.priority as CompanyFact["priority"] }))
  );
  const companyNames = new Map(companiesSection.state === "available" ? companiesSection.data.map((c) => [c.id, c.name]) : []);

  const leads = await section<LeadFact[]>("Leads", "crm.read", () => sel("crm_leads", {}), (rows) =>
    rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      company: strOrNull(r.company_name),
      status: r.status as LeadFact["status"],
      source: strOrNull(r.source),
      ownerId: strOrNull(r.owner_id),
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
      lastContactedAt: isoOrNull(r.last_contacted_at),
    }))
  );
  const opportunities = await section<OpportunityFact[]>("Opportunities", "crm.read", () => sel("crm_opportunities", {}), (rows) =>
    rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      companyId: strOrNull(r.company_id),
      companyName: r.company_id ? (companyNames.get(String(r.company_id)) ?? null) : null,
      stage: r.stage as OpportunityFact["stage"],
      amount: numOrNull(r.amount),
      probability: numOrNull(r.probability),
      expectedCloseDate: isoOrNull(r.expected_close_date),
      ownerId: strOrNull(r.owner_id),
      stageChangedAt: isoOrNull(r.stage_changed_at),
      updatedAt: iso(r.updated_at),
    }))
  );
  const proposals = await section<ProposalFact[]>("Proposals", "crm.read", () => sel("crm_proposals", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), title: String(r.title), opportunityId: strOrNull(r.opportunity_id), companyId: strOrNull(r.company_id), status: r.status as ProposalFact["status"], amount: numOrNull(r.amount), sentAt: isoOrNull(r.sent_at), validUntil: isoOrNull(r.valid_until) }))
  );
  const contracts = await section<ContractFact[]>("Contracts", "crm.read", () => sel("crm_contracts", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), title: String(r.title), companyId: strOrNull(r.company_id), status: r.status as ContractFact["status"], value: numOrNull(r.contract_value), signedAt: isoOrNull(r.signed_at), endDate: isoOrNull(r.end_date) }))
  );

  // ── Delivery ──────────────────────────────────────────────────────────────────
  const projects = await section<ProjectFact[]>("Projects", "projects.read", () => sel("projects", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), name: String(r.name), companyId: strOrNull(r.company_id), kind: r.kind as ProjectFact["kind"], status: r.status as ProjectFact["status"], dueDate: isoOrNull(r.due_date), ownerId: strOrNull(r.owner_id), updatedAt: iso(r.updated_at) }))
  );
  const milestones = await section<MilestoneFact[]>("Milestones", "projects.read", () => sel("project_milestones", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), projectId: String(r.project_id), name: String(r.name), dueDate: isoOrNull(r.due_date), status: r.status as MilestoneFact["status"] }))
  );
  const deliverables = await section<DeliverableFact[]>("Deliverables", "projects.read", () => sel("deliverables", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), projectId: strOrNull(r.project_id), companyId: strOrNull(r.company_id), title: String(r.title), status: r.status as DeliverableFact["status"], dueDate: isoOrNull(r.due_date), submittedAt: isoOrNull(r.submitted_at), changeRequests: Number(r.change_requests ?? 0) }))
  );

  // ── Finance ───────────────────────────────────────────────────────────────────
  const invoices = await section<InvoiceFact[]>(
    "Invoices",
    "finance.read",
    () => Promise.all([sel("finance_invoices", { status: { in: ["draft", "issued", "partially_paid"] } }), sel("finance_invoices", { status: "paid", updated_at: { gte: month.previousStart } })]),
    (rows) =>
      dedupe(rows).map<InvoiceFact>((r) => ({
        id: String(r.id),
        number: String(r.number),
        companyId: strOrNull(r.company_id),
        companyName: r.company_id ? (companyNames.get(String(r.company_id)) ?? null) : null,
        projectId: strOrNull(r.project_id),
        status: r.status as InvoiceFact["status"],
        issueDate: r.issue_date ? String(r.issue_date).slice(0, 10) : null,
        dueDate: r.due_date ? new Date(String(r.due_date)).toISOString() : null,
        total: Number(r.total),
        currency: String(r.currency),
      }))
  );
  const payments = await section<PaymentFact[]>("Payments", "finance.read", () => sel("finance_payments", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), invoiceId: strOrNull(r.invoice_id), amount: Number(r.amount), currency: String(r.currency), receivedAt: iso(r.received_at) }))
  );
  const expenses = await section<ExpenseFact[]>("Expenses", "finance.read", () => sel("expenses", { expense_date: { gte: month.previousStart.slice(0, 10) } }), (rows) =>
    rows.map((r) => ({ id: String(r.id), amount: Number(r.amount), incurredAt: new Date(`${String(r.expense_date).slice(0, 10)}T00:00:00.000Z`).toISOString() }))
  );

  // ── People ────────────────────────────────────────────────────────────────────
  const openTasks = tasks.state === "available" ? tasks.data.filter((t) => t.status === "todo" || t.status === "in_progress" || t.status === "blocked") : null;
  const estimateByUser = new Map<string, number>();
  const taskRows: Row[] = [];
  if (openTasks && can(ctx, "people.read")) {
    const est = await db.select("operational_tasks", { columns: "id,assignee_id,estimate_hours", where: { organization_id: org, status: { in: ["todo", "in_progress", "blocked"] } }, limit: ROW_LIMIT });
    if (!est.error) taskRows.push(...est.data);
  }
  for (const r of taskRows) if (r.assignee_id) estimateByUser.set(String(r.assignee_id), (estimateByUser.get(String(r.assignee_id)) ?? 0) + Number(r.estimate_hours ?? 0));

  const certified = new Map<string, string[]>();
  if (can(ctx, "academy.read") && can(ctx, "people.read")) {
    const [skillsRes, progRes] = await Promise.all([db.select("academy_skills", { where: { organization_id: org }, limit: ROW_LIMIT }), db.select("academy_progress", { where: { organization_id: org, stage: "certified" }, limit: ROW_LIMIT })]);
    if (!skillsRes.error && !progRes.error) {
      const keyById = new Map(skillsRes.data.map((s) => [String(s.id), String(s.skill_key)]));
      for (const p of progRes.data) {
        const key = keyById.get(String(p.skill_id));
        if (key) certified.set(String(p.user_id), [...(certified.get(String(p.user_id)) ?? []), key]);
      }
    }
  }

  const people = await section<PersonCapacity[]>("People", "people.read", () => sel("people_profiles", {}), (rows) =>
    rows.map<PersonCapacity>((r) => {
      const uid = strOrNull(r.user_id);
      const skills: Record<string, SkillLevel> = {};
      for (const [k, v] of Object.entries((r.skills as Record<string, number> | null) ?? {})) if ([1, 2, 3, 4, 5].includes(Number(v))) skills[k] = Number(v) as SkillLevel;
      return {
        userId: uid ?? `profile:${String(r.id)}`,
        name: String(r.display_name),
        roleTitle: strOrNull(r.role_title),
        status: r.status as PersonCapacity["status"],
        skills,
        certifiedSkills: uid ? certified.get(uid) : undefined,
        weeklyCapacityHours: numOrNull(r.weekly_capacity_hours),
        committedHours: uid ? (estimateByUser.get(uid) ?? 0) : 0,
        openTaskCount: uid && openTasks ? openTasks.filter((t) => t.assigneeId === uid).length : 0,
        // No independently verified delivery history source exists yet, so none is used.
        history: null,
      };
    })
  );

  // ── Approvals (the one ledger) ────────────────────────────────────────────────
  const approvals = await section<ApprovalFact[]>(
    "Approvals",
    "approvals.read",
    () => db.select("rinpo_actions", { where: { organization_id: org, source_domain: "company-os", status: "pending" }, order: [{ column: "created_at", ascending: true }], limit: ROW_LIMIT }),
    (rows) =>
      rows
        .filter((r) => r.requires_approval === true && (!r.expires_at || new Date(String(r.expires_at)).getTime() > now.getTime()))
        .map<ApprovalFact>((r) => ({
          id: String(r.id),
          actionType: String(r.action_type),
          summary: summariseAction(String(r.action_type), (r.input as Record<string, unknown>) ?? {}),
          risk: (r.risk_level as ApprovalFact["risk"]) ?? "HIGH",
          requestedAt: iso(r.created_at),
          expiresAt: isoOrNull(r.expires_at),
          actorKind: (r.actor_kind as ApprovalFact["actorKind"]) ?? "user",
          agentRole: strOrNull(r.agent_role),
          requestedBy: strOrNull(r.user_id),
        }))
  );

  // ── Studio / growth / ads ─────────────────────────────────────────────────────
  const studioJobs = await section<StudioJobFact[]>("Studio jobs", "studio.read", () => sel("studio_jobs", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), title: String(r.title), stage: String(r.stage), companyId: strOrNull(r.company_id), dueDate: isoOrNull(r.due_date), ownerId: strOrNull(r.owner_id), stageEnteredAt: iso(r.stage_entered_at), status: r.status as StudioJobFact["status"] }))
  );
  const assets = await section<AssetFact[]>("Creative assets", "studio.read", () => sel("creative_assets", {}), (rows) =>
    rows.map((r) => {
      const record = rowToAsset(r);
      return { id: record.id, kind: record.kind, approvalStatus: record.approvalStatus, createdAt: iso(r.created_at), provenanceComplete: !assetProblems(record).some((p) => p.blocking) };
    })
  );
  const campaigns = await section<CampaignFact[]>("Campaigns", "growth.read", () => sel("growth_campaigns", {}), (rows) =>
    rows.map((r) => ({ id: String(r.id), name: String(r.name), status: r.status as CampaignFact["status"], channels: ((r.channels as string[] | null) ?? []) as string[] }))
  );

  let adSignals: Section<AdSignalFact[]>;
  if (!can(ctx, "growth.read")) adSignals = unavailable("Your role does not include growth.read.");
  else {
    const since = new Date(now.getTime() - 30 * MS_PER_DAY).toISOString().slice(0, 10);
    const res = await db.select("ad_metrics_daily", { where: { organization_id: org, metric_date: { gte: since } }, limit: ROW_LIMIT });
    if (res.error) adSignals = unavailable(isMissingSchema(res.error) ? SCHEMA_PENDING : `Ad metrics could not be read: ${res.error.message}`);
    else if (res.data.length === 0) adSignals = notConnected("No ad metrics have been imported. Connect an official ad-platform adapter or import a provider export; nothing is estimated.");
    else {
      const days: AdDay[] = res.data.map((r) => ({
        adId: String(r.ad_id),
        adName: String(r.ad_name),
        campaignId: strOrNull(r.ad_campaign_id),
        platform: "ads",
        date: String(r.metric_date).slice(0, 10),
        spend: Number(r.spend),
        impressions: Number(r.impressions),
        clicks: Number(r.clicks),
        conversions: Number(r.conversions),
        frequency: numOrNull(r.frequency),
        hook: strOrNull(r.hook),
        audience: strOrNull(r.audience),
        landingPage: strOrNull(r.landing_page),
      }));
      adSignals = available(
        detectAdSignals(days).map((s) => ({ id: s.id, kind: s.kind, severity: s.severity, title: s.title, evidence: s.evidence, campaignId: s.campaignId })),
        asOf
      );
    }
  }

  // ── Logistics / communication ─────────────────────────────────────────────────
  const shipments = await section<ShipmentFact[]>("Shipments", "commerce.order.read", () => sel("shipments", {}), (rows) =>
    rows.map<ShipmentFact>((r) => {
      const status = String(r.status);
      const delivered = !!r.delivered_at || /deliver/i.test(status);
      const exception = /exception|fail|undeliver|rto|return|lost|damag/i.test(status) ? status : null;
      const shippedAt = r.shipped_at ? new Date(String(r.shipped_at)).getTime() : null;
      const stale = !delivered && shippedAt !== null && now.getTime() - shippedAt > SHIPMENT_STALE_DAYS * MS_PER_DAY;
      return { id: String(r.id), orderRef: strOrNull(r.order_id), status, carrier: strOrNull(r.carrier), trackingNumber: strOrNull(r.awb), expectedDelivery: null, delayed: stale, exception };
    })
  );
  const commExceptions = await section<CommExceptionFact[]>(
    "Communication",
    "comms.read",
    () => db.select("comm_activities", { where: { organization_id: org, status: { in: ["failed", "missed"] }, occurred_at: { gte: new Date(now.getTime() - 14 * MS_PER_DAY).toISOString() } }, limit: ROW_LIMIT }),
    (rows) => rows.map((r) => ({ id: String(r.id), channel: String(r.channel), summary: String(r.subject ?? r.summary ?? `${r.channel} ${r.status}`), occurredAt: iso(r.occurred_at), linkedType: strOrNull(r.linked_type), linkedId: strOrNull(r.linked_id) }))
  );

  // ── AI ────────────────────────────────────────────────────────────────────────
  const aiRuns = await section<AiRunFact[]>(
    "AI runs",
    "ai.read",
    () => db.select("ai_runs", { where: { organization_id: org, started_at: { gte: new Date(now.getTime() - 7 * MS_PER_DAY).toISOString() } }, order: [{ column: "started_at", ascending: false }], limit: ROW_LIMIT }),
    (rows) => rows.map((r) => ({ id: String(r.id), provider: String(r.provider), model: String(r.model), agentRole: strOrNull(r.agent_role), status: r.status as AiRunFact["status"], costUsd: numOrNull(r.cost_usd), startedAt: iso(r.started_at), errorClass: strOrNull(r.error_class) }))
  );

  const engineering: EngineeringFacts =
    input.engineering && can(ctx, "engineering.read")
      ? input.engineering
      : {
          github: can(ctx, "engineering.read") ? notConnected("GitHub is not connected.") : unavailable("Your role does not include engineering.read."),
          vercel: can(ctx, "engineering.read") ? notConnected("Vercel is not connected.") : unavailable("Your role does not include engineering.read."),
          supabase: can(ctx, "engineering.read") ? notConnected("Supabase health is not connected.") : unavailable("Your role does not include engineering.read."),
        };

  void day;
  return {
    facts: {
      organizationId: org,
      organizationName: input.organizationName,
      asOf,
      tasks,
      alerts,
      leads,
      companies: companiesSection,
      opportunities,
      proposals,
      contracts,
      projects,
      milestones,
      deliverables,
      invoices,
      payments,
      expenses,
      people,
      approvals,
      studioJobs,
      assets,
      campaigns,
      adSignals,
      shipments,
      commExceptions,
      aiRuns,
      engineering,
    },
    notes,
  };
}

function dedupe(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(String(r.id)) ? false : (seen.add(String(r.id)), true)));
}

export function summariseAction(actionType: string, input: Record<string, unknown>): string {
  const pick = (...keys: string[]) => keys.map((k) => input[k]).find((v) => typeof v === "string" || typeof v === "number");
  const label = actionType.replace(/[._]/g, " ");
  const detail = pick("title", "name", "number", "amount", "proposedBudget", "invoiceId", "contractId", "proposalId", "contentId");
  return detail !== undefined ? `${label}: ${String(detail).slice(0, 80)}` : label;
}

export function rowToAsset(row: Row): AssetRecord {
  return {
    id: String(row.id),
    kind: row.kind as AssetRecord["kind"],
    title: String(row.title),
    version: Number(row.version),
    role: row.role as AssetRecord["role"],
    parentAssetId: strOrNull(row.parent_asset_id),
    creatorKind: row.creator_kind as AssetRecord["creatorKind"],
    creatorUserId: strOrNull(row.creator_user_id),
    aiProvider: strOrNull(row.ai_provider),
    aiModel: strOrNull(row.ai_model),
    promptRef: strOrNull(row.prompt_ref),
    sourceKind: row.source_kind as AssetRecord["sourceKind"],
    licenseTerms: strOrNull(row.license_terms),
    licenseRef: strOrNull(row.license_ref),
    companyId: strOrNull(row.company_id),
    campaignId: strOrNull(row.campaign_id),
    projectId: strOrNull(row.project_id),
    approvalStatus: row.approval_status as AssetRecord["approvalStatus"],
    channel: strOrNull(row.channel),
    storagePath: strOrNull(row.storage_path),
  };
}
