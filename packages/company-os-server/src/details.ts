import { available, can, notConnected, unavailable, type OrgContext, type Section } from "@rinads/company-os";
import { SCHEMA_PENDING, summariseAction } from "./facts";
import { isMissingSchema, type Filter, type Row, type RowDb } from "./db";

/**
 * Detail readers for the area pages that need whole rows (not the summarised facts the Founder view uses).
 * Every read runs on the caller's RLS-bound session AND is permission-gated here so the page can say
 * "your role does not include X" instead of an empty list. A missing schema or a failed read is an
 * explicit unavailable state — never an empty-looking success.
 */

const LIMIT = 500;

export async function readDetail(
  db: RowDb,
  ctx: OrgContext,
  permission: string | null,
  table: string,
  opts: { where?: Filter; order?: { column: string; ascending?: boolean }[]; limit?: number } = {}
): Promise<Section<Row[]>> {
  if (permission && !can(ctx, permission)) return unavailable(`Your role does not include ${permission}.`);
  try {
    const res = await db.select(table, { where: { organization_id: ctx.organizationId, ...(opts.where ?? {}) }, order: opts.order, limit: opts.limit ?? LIMIT });
    if (res.error) return unavailable(isMissingSchema(res.error) ? SCHEMA_PENDING : `${table} could not be read: ${res.error.message}`);
    return available(res.data, new Date().toISOString());
  } catch (e) {
    return unavailable(`${table} could not be read: ${e instanceof Error ? e.message : "unknown error"}`);
  }
}

const newest = [{ column: "created_at", ascending: false }];

export type ActionHistoryItem = {
  id: string;
  actionType: string;
  summary: string;
  status: string;
  risk: string;
  actorKind: string;
  agentRole: string | null;
  requestedBy: string | null;
  decidedBy: string | null;
  requestedAt: string;
  decidedAt: string | null;
  error: string | null;
};

/** Recently decided / executed / failed governed actions (the audit-facing view of the one ledger). */
export async function loadActionHistory(db: RowDb, ctx: OrgContext): Promise<Section<ActionHistoryItem[]>> {
  const res = await readDetail(db, ctx, "approvals.read", "rinpo_actions", { where: { source_domain: "company-os", status: { neq: "pending" } }, order: newest, limit: 100 });
  if (res.state !== "available") return res;
  return available(
    res.data.map((r) => ({
      id: String(r.id),
      actionType: String(r.action_type),
      summary: summariseAction(String(r.action_type), (r.input as Record<string, unknown>) ?? {}),
      status: String(r.status),
      risk: String(r.risk_level ?? "LOW"),
      actorKind: String(r.actor_kind ?? "user"),
      agentRole: r.agent_role ? String(r.agent_role) : null,
      requestedBy: r.user_id ? String(r.user_id) : null,
      decidedBy: r.approved_by ? String(r.approved_by) : null,
      requestedAt: new Date(String(r.created_at)).toISOString(),
      decidedAt: r.resolved_at ? new Date(String(r.resolved_at)).toISOString() : null,
      error: r.error_class ? String(r.error_class).slice(0, 200) : null,
    })),
    res.asOf
  );
}

export type StudioDetail = {
  jobs: Section<Row[]>;
  assets: Section<Row[]>;
  publications: Section<Row[]>;
};
export async function loadStudioDetail(db: RowDb, ctx: OrgContext): Promise<StudioDetail> {
  const [jobs, assets, publications] = await Promise.all([
    readDetail(db, ctx, "studio.read", "studio_jobs", { order: newest }),
    readDetail(db, ctx, "studio.read", "creative_assets", { order: newest }),
    readDetail(db, ctx, "studio.read", "asset_publications", { order: newest, limit: 200 }),
  ]);
  return { jobs, assets, publications };
}

export type GrowthDetail = { campaigns: Section<Row[]>; content: Section<Row[]> };
export async function loadGrowthDetail(db: RowDb, ctx: OrgContext): Promise<GrowthDetail> {
  const [campaigns, content] = await Promise.all([
    readDetail(db, ctx, "growth.read", "growth_campaigns", { order: newest }),
    readDetail(db, ctx, "growth.read", "content_items", { order: newest }),
  ]);
  return { campaigns, content };
}

export type AdsDetail = { ads: Section<Row[]>; metrics: Section<Row[]> };
export async function loadAdsDetail(db: RowDb, ctx: OrgContext, now: Date): Promise<AdsDetail> {
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [ads, metrics] = await Promise.all([
    readDetail(db, ctx, "growth.read", "ad_campaigns", { order: newest }),
    readDetail(db, ctx, "growth.read", "ad_metrics_daily", { where: { metric_date: { gte: since } }, order: [{ column: "metric_date", ascending: false }], limit: 1000 }),
  ]);
  return { ads, metrics };
}

export type CommDetail = { activities: Section<Row[]> };
export async function loadCommDetail(db: RowDb, ctx: OrgContext): Promise<CommDetail> {
  return { activities: await readDetail(db, ctx, "comms.read", "comm_activities", { order: [{ column: "occurred_at", ascending: false }], limit: 200 }) };
}

export type AcademyDetail = { skills: Section<Row[]>; progress: Section<Row[]> };
export async function loadAcademyDetail(db: RowDb, ctx: OrgContext): Promise<AcademyDetail> {
  const [skills, progress] = await Promise.all([
    readDetail(db, ctx, "academy.read", "academy_skills", { order: [{ column: "skill_key", ascending: true }] }),
    readDetail(db, ctx, "academy.read", "academy_progress", { order: [{ column: "updated_at", ascending: false }] }),
  ]);
  return { skills, progress };
}

export type AiDetail = { runs: Section<Row[]>; profiles: Section<Row[]> };
export async function loadAiDetail(db: RowDb, ctx: OrgContext, now: Date): Promise<AiDetail> {
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const [runs, profiles] = await Promise.all([
    readDetail(db, ctx, "ai.read", "ai_runs", { where: { started_at: { gte: since } }, order: [{ column: "started_at", ascending: false }], limit: 500 }),
    readDetail(db, ctx, "ai.read", "ai_agent_profiles", {}),
  ]);
  return { runs, profiles };
}

export type LogisticsDetail = { shipments: Section<Row[]>; orders: Section<Row[]>; returns: Section<Row[]> };
export async function loadLogisticsDetail(db: RowDb, ctx: OrgContext): Promise<LogisticsDetail> {
  const [shipments, orders, returns] = await Promise.all([
    readDetail(db, ctx, "commerce.order.read", "shipments", { order: newest, limit: 200 }),
    readDetail(db, ctx, "commerce.order.read", "orders", { order: newest, limit: 100 }),
    readDetail(db, ctx, "commerce.order.read", "return_requests", { order: newest, limit: 100 }),
  ]);
  return { shipments, orders, returns };
}

export const notConnectedSection = <T>(reason: string): Section<T> => notConnected(reason);

import type { AdDay } from "@rinads/company-os";

/** Raw ad_metrics_daily rows → the AdDay shape used by `detectAdSignals`. */
export function rowsToAdDays(rows: readonly Row[]): AdDay[] {
  return rows.map((r) => ({
    adId: String(r.ad_id),
    adName: String(r.ad_name),
    campaignId: r.ad_campaign_id ? String(r.ad_campaign_id) : null,
    platform: "ads",
    date: String(r.metric_date).slice(0, 10),
    spend: Number(r.spend),
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    conversions: Number(r.conversions),
    frequency: r.frequency === null || r.frequency === undefined ? null : Number(r.frequency),
    hook: r.hook ? String(r.hook) : null,
    audience: r.audience ? String(r.audience) : null,
    landingPage: r.landing_page ? String(r.landing_page) : null,
  }));
}
