import { createHash } from "node:crypto";
import { payloadHash } from "@rinads/company-os-engine";

/**
 * Synthetic "RINADS Technologies — Preview Demo" organisation for NON-PRODUCTION previews.
 *
 * Everything here is fictional: people, clients, invoices, campaigns, shipments, AI runs. It exists so a
 * preview of the Company OS can be shown with real database relationships (RLS, approval gates, events)
 * instead of invented dashboard numbers — every figure on screen is computed from these rows.
 *
 * Safety:
 *  - the generated SQL refuses to run unless the database contains no organisation outside the two demo
 *    organisations (a clean Supabase preview branch; the migration-seeded 'staging-demo' fixture org is tolerated), so it cannot be applied to production by accident;
 *  - it needs `set rinads.allow_demo_seed = 'yes'` in the same session;
 *  - it creates no credentials and sends nothing; pending approvals are real ledger rows with correct payload
 *    hashes so they can be approved in the UI, and approving a deployment fails honestly (not executable here).
 *
 * Output is deterministic (ids derive from stable keys) and relative to `now()`, so it can be re-applied.
 */

export const DEMO_ORG_ID = demoId("org:rinads-demo");
export const DEMO_OTHER_ORG_ID = demoId("org:other-demo");
export const DEMO_EMAIL_DOMAIN = "rinads-preview.test";

/** md5-derived, valid v4-shaped UUID (the tools validate ids). */
export function demoId(key: string): string {
  const h = createHash("md5").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// ── personas ──────────────────────────────────────────────────────────────────

export type Persona = { key: string; name: string; role: "founder" | "manager" | "staff" | "client" | "admin"; org: "demo" | "other"; email: string; title: string };

const persona = (key: string, name: string, role: Persona["role"], title: string, org: Persona["org"] = "demo"): Persona => ({ key, name, role, org, title, email: `${key}.demo@${DEMO_EMAIL_DOMAIN}` });

export const PERSONAS: readonly Persona[] = [
  persona("founder", "Founder (Demo)", "founder", "Founder & CEO"),
  persona("asha", "Asha Menon (Demo)", "manager", "Head of Delivery"),
  persona("rohan", "Rohan Iyer (Demo)", "manager", "Head of Growth & Brand"),
  persona("divya", "Divya Nair (Demo)", "staff", "Senior Designer"),
  persona("kabir", "Kabir Shah (Demo)", "staff", "Video Editor"),
  persona("meera", "Meera Das (Demo)", "staff", "Copywriter"),
  persona("nikhil", "Nikhil Rao (Demo)", "staff", "Software Engineer"),
  persona("sana", "Sana Khan (Demo)", "staff", "Ads Specialist"),
  persona("tarun", "Tarun Pillai (Demo)", "staff", "Accounts"),
  persona("client", "Lakshmi Textiles — Client (Demo)", "client", "Client contact"),
  persona("otheradmin", "Other Tenant Admin (Demo)", "admin", "Admin of an unrelated tenant", "other"),
];
export const personaId = (key: string): string => demoId(`user:${key}`);
const U = personaId;
const W = (key: string): string => demoId(`worker:${key}`);

// ── SQL literal helpers ───────────────────────────────────────────────────────

class Raw {
  constructor(readonly sql: string) {}
}
const raw = (sql: string): Raw => new Raw(sql);
const ago = (days: number) => raw(`now() - interval '${days} days'`);
const ahead = (days: number) => raw(`now() + interval '${days} days'`);
const agoH = (hours: number) => raw(`now() - interval '${hours} hours'`);
const aheadH = (hours: number) => raw(`now() + interval '${hours} hours'`);
const dAgo = (days: number) => raw(`current_date - ${days}`);
const dAhead = (days: number) => raw(`current_date + ${days}`);
const monthStart = (offsetHours: number) => raw(`date_trunc('month', now()) + interval '${offsetHours} hours'`);
const prevMonth = (daysBeforeMonthStart: number) => raw(`date_trunc('month', now()) - interval '${daysBeforeMonthStart} days'`);
const textArr = (xs: readonly string[]) => raw(xs.length ? `ARRAY[${xs.map((x) => lit(x)).join(", ")}]::text[]` : "'{}'::text[]");
const uuidArr = (xs: readonly string[]) => raw(xs.length ? `ARRAY[${xs.map((x) => lit(x)).join(", ")}]::uuid[]` : "'{}'::uuid[]");
const json = (v: unknown) => raw(`${lit(JSON.stringify(v))}::jsonb`);

type Value = string | number | boolean | null | Raw;
function lit(v: Value): string {
  if (v === null) return "NULL";
  if (v instanceof Raw) return v.sql;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${v.replaceAll("'", "''")}'`;
}

function insert(table: string, columns: string[], rows: Value[][], tail = "ON CONFLICT DO NOTHING"): string {
  if (rows.length === 0) return "";
  const body = rows.map((r) => {
    if (r.length !== columns.length) throw new Error(`${table}: row has ${r.length} values for ${columns.length} columns`);
    return `  (${r.map(lit).join(", ")})`;
  });
  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${body.join(",\n")}\n${tail};\n`;
}

// ── ledger helper ─────────────────────────────────────────────────────────────

type Ledger = {
  key: string;
  type: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requester: string;
  input: Record<string, unknown>;
  status: "executed" | "pending";
  approver?: string;
  agent?: { role: string; provider: string; model: string };
  daysAgo?: number;
};
const actionId = (key: string) => demoId(`action:${key}`);

const LEDGER_COLUMNS = [
  "id", "organization_id", "user_id", "action_type", "input", "output", "status", "source_domain", "idempotency_key", "risk_level",
  "payload_hash", "requires_approval", "distinct_approver", "approver_permission", "expires_at", "actor_kind", "agent_role", "provider",
  "model", "correlation_id", "approved_by", "resolved_at", "executed_at", "created_at",
];

function ledgerRow(l: Ledger): Value[] {
  const requiresApproval = l.risk === "HIGH" || l.risk === "CRITICAL";
  const created = ago(l.daysAgo ?? 1);
  return [
    actionId(l.key), DEMO_ORG_ID, U(l.requester), l.type, json(l.input), l.status === "executed" ? json({ ok: true, seeded: true }) : null, l.status, "company-os",
    `demo-seed:${l.key}`, l.risk, payloadHash(l.type, l.input), requiresApproval, l.agent ? false : requiresApproval, "approvals.decide",
    l.status === "pending" ? ahead(7) : ahead(1), l.agent ? "agent" : "user", l.agent?.role ?? null, l.agent?.provider ?? null, l.agent?.model ?? null,
    `demo-${l.key}`, l.status === "executed" && l.approver ? U(l.approver) : null, l.status === "executed" ? created : null, l.status === "executed" ? created : null, created,
  ];
}

// ── the data ──────────────────────────────────────────────────────────────────

const DEPARTMENTS: [string, string, string | null, string][] = [
  ["founder_office", "Founder Office", "founder", "Direction, decisions and company health"],
  ["product_platform", "Product & Platform", "asha", "RINADS platform, RINPO and Cloud"],
  ["engineering", "Engineering", "asha", "Build, release and reliability"],
  ["ai_automation", "AI & Automation", "asha", "RINADS Intelligence and workflows"],
  ["sales", "Sales", "rohan", "Pipeline, proposals and contracts"],
  ["customer_ops", "Customer Operations", "asha", "Delivery, support and client success"],
  ["studio", "RINADS Studio", "asha", "Creative production"],
  ["growth_brand", "Growth & Brand", "rohan", "Content, SEO and brand"],
  ["advertising", "Advertising", "rohan", "Paid media"],
  ["finance_admin", "Finance & Administration", "founder", "Invoicing, collections and costs"],
  ["people_culture", "People & Culture", "founder", "Team, capacity and learning"],
  ["logistics_comms", "Logistics & Communications", "asha", "Fulfilment and conversations"],
  ["industry_platforms", "Industry Platforms", "asha", "Vertical platforms"],
  ["university", "RINADS University", "rohan", "Academy and certification"],
];

const WORKERS: { key: string; user: string | null; name: string; title: string; dept: string; skills: Record<string, number>; hours: number; cost: number; committed: number }[] = [
  { key: "founder", user: "founder", name: "Founder (Demo)", title: "Founder & CEO", dept: "founder_office", skills: { strategy: 5, sales: 5 }, hours: 30, cost: 0, committed: 18 },
  { key: "asha", user: "asha", name: "Asha Menon (Demo)", title: "Head of Delivery", dept: "customer_ops", skills: { strategy: 4, project_management: 5, engineering: 3 }, hours: 40, cost: 1800, committed: 30 },
  { key: "rohan", user: "rohan", name: "Rohan Iyer (Demo)", title: "Head of Growth & Brand", dept: "growth_brand", skills: { strategy: 4, copywriting: 4, ads: 4, sales: 4 }, hours: 40, cost: 1700, committed: 24 },
  { key: "divya", user: "divya", name: "Divya Nair (Demo)", title: "Senior Designer", dept: "studio", skills: { design: 5, motion: 3 }, hours: 40, cost: 1200, committed: 36 },
  { key: "kabir", user: "kabir", name: "Kabir Shah (Demo)", title: "Video Editor", dept: "studio", skills: { video_editing: 5, motion: 4 }, hours: 40, cost: 1100, committed: 46 },
  { key: "meera", user: "meera", name: "Meera Das (Demo)", title: "Copywriter", dept: "growth_brand", skills: { copywriting: 5, strategy: 2 }, hours: 32, cost: 900, committed: 12 },
  { key: "nikhil", user: "nikhil", name: "Nikhil Rao (Demo)", title: "Software Engineer", dept: "engineering", skills: { engineering: 5, design: 2 }, hours: 40, cost: 1500, committed: 24 },
  { key: "sana", user: "sana", name: "Sana Khan (Demo)", title: "Ads Specialist", dept: "advertising", skills: { ads: 5, copywriting: 3 }, hours: 32, cost: 1000, committed: 10 },
  { key: "tarun", user: "tarun", name: "Tarun Pillai (Demo)", title: "Accounts", dept: "finance_admin", skills: { accounts: 5 }, hours: 32, cost: 800, committed: 13 },
  { key: "contractor", user: null, name: "Contract Motion Artist (Demo)", title: "Freelance motion designer", dept: "studio", skills: { motion: 5, vfx: 4 }, hours: 20, cost: 1400, committed: 0 },
];

const COMPANIES = [
  { key: "kerala", name: "Kerala Spice Co (Demo)", industry: "Food & beverage", stage: "client", priority: "strategic", health: 78, owner: "asha" },
  { key: "lakshmi", name: "Lakshmi Textiles (Demo)", industry: "Retail", stage: "client", priority: "standard", health: 64, owner: "asha" },
  { key: "northwind", name: "Northwind Wellness (Demo)", industry: "Wellness", stage: "opportunity", priority: "standard", health: null, owner: "rohan" },
  { key: "harbor", name: "Harbor Coffee Roasters (Demo)", industry: "Food & beverage", stage: "qualified", priority: "low", health: null, owner: "rohan" },
  { key: "oldmill", name: "Old Mill Furnishings (Demo)", industry: "Home", stage: "churned", priority: "low", health: 22, owner: "asha" },
] as const;
const CO = (k: string) => demoId(`co:${k}`);
const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "");

type TaskSeed = { key: string; title: string; project: string | null; milestone?: string; company?: string; status: string; priority: string; assignee: string | null; est: number | null; due: Raw | null; skills?: string[]; blockedBy?: string[]; done?: Raw; ai?: boolean };
const TASKS: TaskSeed[] = [
  { key: "t01", title: "Final script — Monsoon Festival film", project: "p1", status: "done", priority: "normal", assignee: "meera", est: 6, due: ago(8), done: ago(6), skills: ["copywriting"] },
  { key: "t02", title: "Storyboard frames", project: "p1", status: "done", priority: "normal", assignee: "divya", est: 10, due: ago(6), done: ago(4), skills: ["design"] },
  { key: "t03", title: "Shoot-day logistics", project: "p1", status: "done", priority: "normal", assignee: "asha", est: 5, due: ago(10), done: ago(9) },
  { key: "t04", title: "Hero film rough cut", project: "p1", milestone: "m1", status: "in_progress", priority: "critical", assignee: "kabir", est: 20, due: ago(2), skills: ["video_editing"] },
  { key: "t05", title: "Colour grade hero film", project: "p1", status: "todo", priority: "high", assignee: null, est: 12, due: ahead(3), skills: ["video_editing"], blockedBy: ["t04"] },
  { key: "t06", title: "Instagram reel cut-downs ×6", project: "p1", milestone: "m3", status: "todo", priority: "normal", assignee: "kabir", est: 10, due: ahead(5), skills: ["video_editing", "motion"], blockedBy: ["t04"] },
  { key: "t07", title: "Thumbnail set (YouTube + Shorts)", project: "p1", status: "in_progress", priority: "high", assignee: "divya", est: 6, due: aheadH(0.2), skills: ["design"], ai: true },
  { key: "t08", title: "Client review deck", project: "p1", status: "review", priority: "normal", assignee: "asha", est: 4, due: ahead(1) },
  { key: "t09", title: "Product page template", project: "p2", status: "done", priority: "normal", assignee: "nikhil", est: 12, due: ago(2), done: agoH(2), skills: ["engineering"] },
  { key: "t10", title: "Checkout bug: coupon stacking", project: "p2", milestone: "m5", status: "in_progress", priority: "critical", assignee: "nikhil", est: 8, due: ago(1), skills: ["engineering"] },
  { key: "t11", title: "Payment gateway sandbox test (waiting on client credentials)", project: "p2", status: "waiting", priority: "normal", assignee: "nikhil", est: 4, due: ahead(2), skills: ["engineering"] },
  { key: "t12", title: "Responsive QA pass", project: "p2", status: "todo", priority: "normal", assignee: "divya", est: 16, due: ahead(4), skills: ["design"] },
  { key: "t13", title: "Catalogue upload (client assets pending)", project: "p2", status: "waiting", priority: "low", assignee: "meera", est: 3, due: ahead(6) },
  { key: "t14", title: "Release checklist & rollback plan", project: "p3", milestone: "m6", status: "in_progress", priority: "high", assignee: "nikhil", est: 6, due: ahead(2), skills: ["engineering"] },
  { key: "t15", title: "INCIDENT: webhook retries failing on staging", project: "p3", status: "in_progress", priority: "critical", assignee: "nikhil", est: 10, due: ago(0.5), skills: ["engineering"] },
  { key: "t16", title: "Security review sign-off", project: "p3", status: "todo", priority: "high", assignee: "asha", est: 5, due: ahead(6) },
  { key: "t17", title: "Staging UAT script", project: "p3", status: "todo", priority: "normal", assignee: null, est: 8, due: ahead(7), skills: ["engineering", "strategy"] },
  { key: "t18", title: "Monsoon campaign calendar", project: "p4", status: "done", priority: "normal", assignee: "rohan", est: 6, due: ago(3), done: ago(2), skills: ["strategy"] },
  { key: "t19", title: "YouTube long-form edit", project: "p4", status: "in_progress", priority: "high", assignee: "kabir", est: 16, due: ahead(4), skills: ["video_editing"] },
  { key: "t20", title: "LinkedIn carousel design", project: "p4", status: "todo", priority: "normal", assignee: "divya", est: 14, due: ahead(6), skills: ["design"] },
  { key: "t21", title: "Google Business post set", project: "p4", status: "todo", priority: "low", assignee: "meera", est: 3, due: ahead(3), skills: ["copywriting"] },
  { key: "t22", title: "SEO keyword brief — monsoon recipes", project: "p4", status: "todo", priority: "normal", assignee: "meera", est: 5, due: ahead(8), skills: ["copywriting", "strategy"], ai: true },
  { key: "t23", title: "Ad creative refresh (fatigue detected)", project: "p4", status: "todo", priority: "high", assignee: null, est: 9, due: ahead(2), skills: ["design", "ads"] },
  { key: "t24", title: "Weekly ads report", project: "p4", status: "done", priority: "low", assignee: "sana", est: 3, due: ago(2), done: agoH(20), skills: ["ads"] },
  { key: "t25", title: "Cohort 3 syllabus", project: "p5", status: "todo", priority: "normal", assignee: "rohan", est: 6, due: ahead(14) },
  { key: "t26", title: "Month-end bookkeeping", project: null, status: "in_progress", priority: "normal", assignee: "tarun", est: 10, due: ahead(3), skills: ["accounts"] },
  { key: "t27", title: "Follow up overdue invoice INV-DEMO-004 (Old Mill)", project: null, company: "oldmill", status: "todo", priority: "high", assignee: "tarun", est: 3, due: ago(1), skills: ["accounts"] },
];
const T = (k: string) => demoId(`task:${k}`);

const PROJECTS = [
  { key: "p1", name: "Monsoon Festival brand film & social (Kerala Spice)", company: "kerala", status: "active", health: "warning", owner: "asha", due: dAhead(20), kind: "project", budget: 540000 },
  { key: "p2", name: "Storefront rebuild (Lakshmi Textiles)", company: "lakshmi", status: "active", health: "critical", owner: "asha", due: dAhead(9), kind: "project", budget: 650000 },
  { key: "p3", name: "RINADS Platform v2 release (internal)", company: null, status: "active", health: "warning", owner: "asha", due: dAhead(12), kind: "project", budget: null },
  { key: "p4", name: "Q4 growth campaign (internal)", company: null, status: "active", health: "on_track", owner: "rohan", due: dAhead(10), kind: "project", budget: null },
  { key: "p5", name: "RINADS University — cohort 3", company: null, status: "planned", health: "on_track", owner: "rohan", due: dAhead(40), kind: "project", budget: null },
] as const;
const P = (k: string) => demoId(`project:${k}`);

export type SeedOptions = { includeSafetyGuard?: boolean };

/** The full seed as one SQL script. */
export function buildDemoSeedSql(options: SeedOptions = {}): string {
  const out: string[] = [];
  const add = (s: string) => out.push(s);
  const O = DEMO_ORG_ID;
  const O2 = DEMO_OTHER_ORG_ID;

  add(`-- RINADS Company OS — SYNTHETIC preview data. NEVER run this on production.
-- Generated by packages/company-os-server/src/demo-seed.ts (scripts/preview/write-demo-seed.ts). Do not edit by hand.
-- Everything below is fictional. It sends nothing and creates no credentials.
-- Requires: the persona users in auth.users (see the persona script), and \`set rinads.allow_demo_seed = 'yes'\`.
`);
  if (options.includeSafetyGuard !== false) {
    add(`DO $guard$
BEGIN
  IF coalesce(current_setting('rinads.allow_demo_seed', true), '') <> 'yes' THEN
    RAISE EXCEPTION 'Demo seed refused: run  set rinads.allow_demo_seed = ''yes'';  first (preview databases only).';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id NOT IN (${lit(O)}, ${lit(O2)}) AND slug <> 'staging-demo') THEN
    RAISE EXCEPTION 'Demo seed refused: this database contains organisations other than the demo tenants (and the migration-seeded staging-demo fixture). It is not a clean preview database.';
  END IF;
END
$guard$;
`);
  }

  // organisations ---------------------------------------------------------------
  add(insert("public.organizations", ["id", "name", "slug", "status"], [[O, "RINADS Technologies — Preview Demo", "rinads-demo-preview", "active"], [O2, "Other Demo Tenant — Preview (isolation check)", "rinads-demo-other", "active"]]));
  add(`UPDATE public.organizations SET is_platform_operator = true WHERE id = ${lit(O)};\n`);
  add(
    insert(
      "public.tenant_policies",
      ["organization_id", "policy_key", "policy_value", "version", "is_active"],
      [
        [O, "environment", json({ environment: "demo", synthetic: true, purpose: "Company OS preview", do_not_use_as_company_truth: true }), 1, true],
        [O2, "environment", json({ environment: "demo", synthetic: true, purpose: "Cross-tenant isolation check" }), 1, true],
      ]
    )
  );

  // people ----------------------------------------------------------------------
  add(insert("public.profiles", ["id", "display_name"], PERSONAS.map((p) => [U(p.key), p.name])));
  for (const role of ["founder", "manager", "staff", "client", "admin"] as const) {
    for (const org of ["demo", "other"] as const) {
      const ps = PERSONAS.filter((p) => p.role === role && p.org === org);
      if (!ps.length) continue;
      add(
        `INSERT INTO public.organization_members (organization_id, user_id, role_id, status)\nSELECT ${lit(org === "demo" ? O : O2)}, v.uid::uuid, r.id, 'active'\nFROM (VALUES ${ps.map((p) => `(${lit(U(p.key))})`).join(", ")}) AS v(uid)\nJOIN public.roles r ON r.key = ${lit(role)}\nON CONFLICT (organization_id, user_id) DO NOTHING;\n`
      );
    }
  }
  add(insert("public.cos_departments", ["id", "organization_id", "key", "name", "head_user_id", "objectives"], DEPARTMENTS.map(([k, n, head, o]) => [demoId(`dept:${k}`), O, k, n, head ? U(head) : null, o])));
  add(
    insert(
      "public.cos_workers",
      ["id", "organization_id", "kind", "user_id", "display_name", "department_id", "role_title", "skills", "skill_levels", "availability_status", "cost_per_hour", "available_hours_week", "committed_hours_week", "profile_status"],
      WORKERS.map((w) => [W(w.key), O, "human", w.user ? U(w.user) : null, w.name, demoId(`dept:${w.dept}`), w.title, textArr(Object.keys(w.skills)), json(w.skills), "available", w.cost, w.hours, w.committed, "active"])
    )
  );
  add(
    insert(
      "public.cos_capacity_snapshots",
      ["organization_id", "worker_id", "as_of", "available_hours", "committed_hours", "blocked_hours", "utilization", "risk"],
      WORKERS.map((w) => {
        const util = Math.round((w.committed / w.hours) * 1000) / 10;
        return [O, W(w.key), raw("current_date"), w.hours, w.committed, 0, Math.min(util, 999), util > 110 ? "critical" : util > 90 ? "high" : "normal"];
      })
    )
  );

  // CRM -------------------------------------------------------------------------
  add(
    insert(
      "public.cos_companies",
      ["id", "organization_id", "name", "industry", "website", "lifecycle_stage", "health_score", "health_notes", "priority", "owner_worker_id", "notes"],
      COMPANIES.map((c) => [CO(c.key), O, c.name, c.industry, `https://${slug(c.name)}.example`, c.stage, c.health, c.health ? "Formula inputs: delivery, payments, responsiveness (demo)" : "", c.priority, W(c.owner), "Fictional demo company"])
    )
  );
  const CT = (k: string) => demoId(`contact:${k}`);
  add(
    insert(
      "public.cos_contacts",
      ["id", "organization_id", "company_id", "full_name", "email", "phone", "title", "is_primary"],
      [
        [CT("kerala1"), O, CO("kerala"), "Anjali Varma", "anjali@keralaspice.example", "+91 90000 00001", "Marketing Director", true],
        [CT("kerala2"), O, CO("kerala"), "Suresh Pillai", "suresh@keralaspice.example", "+91 90000 00002", "Finance Lead", false],
        [CT("lakshmi1"), O, CO("lakshmi"), "Lakshmi Rao", "lakshmi@lakshmitextiles.example", "+91 90000 00003", "Owner", true],
        [CT("lakshmi2"), O, CO("lakshmi"), "Dev Menon", "dev@lakshmitextiles.example", "+91 90000 00004", "E-commerce Manager", false],
        [CT("northwind1"), O, CO("northwind"), "Isha Kapoor", "isha@northwindwellness.example", "+91 90000 00005", "Founder", true],
        [CT("harbor1"), O, CO("harbor"), "Vikram Joseph", "vikram@harborcoffee.example", "+91 90000 00006", "Owner", true],
        [CT("oldmill1"), O, CO("oldmill"), "Rekha Shenoy", "rekha@oldmill.example", "+91 90000 00007", "Procurement", true],
      ]
    )
  );
  const L = (k: string) => demoId(`lead:${k}`);
  const OP = (k: string) => demoId(`opp:${k}`);
  add(
    insert(
      "public.cos_leads",
      ["id", "organization_id", "title", "email", "phone", "company_name", "status", "source", "problem", "budget", "timeline", "owner_worker_id", "urgency", "last_contacted_at", "converted_company_id", "converted_contact_id", "converted_opportunity_id", "company_id", "contact_id", "created_at"],
      [
        [L("aurora"), O, "Priya N. — Aurora Bakes (Demo)", "priya@aurorabakes.example", null, "Aurora Bakes", "new", "website", "Wants a new storefront before festival season", "₹3–5L", "6 weeks", W("rohan"), "high", null, null, null, null, null, null, ago(6)],
        [L("coastline"), O, "Dev S. — Coastline Resorts (Demo)", "dev@coastlineresorts.example", null, "Coastline Resorts", "new", "referral", "Brand film for a new resort", "₹5L+", "Q1", W("rohan"), "normal", null, null, null, null, null, null, ago(1)],
        [L("bluebird"), O, "Meghna K. — Bluebird Pharma (Demo)", "meghna@bluebirdpharma.example", null, "Bluebird Pharma", "contacted", "linkedin", "Needs an explainer video series", "₹2L", "Quarter end", W("rohan"), "normal", ago(3), null, null, null, null, null, ago(8)],
        [L("blueharbor"), O, "Anand R. — Blue Harbor Logistics (Demo)", "anand@blueharbor.example", null, "Blue Harbor Logistics", "qualified", "website", "Customer tracking portal", "₹6L", "8 weeks", W("founder"), "high", ago(2), null, null, null, null, null, ago(9)],
        [L("spam"), O, "Spam Inc (Demo)", "spam@spam.example", null, "Spam Inc", "disqualified", "website", "n/a", null, null, null, "low", ago(10), null, null, null, null, null, ago(12)],
        [L("harbor"), O, "Vikram J. — Harbor Coffee Roasters (Demo)", "vikram@harborcoffee.example", null, "Harbor Coffee Roasters (Demo)", "converted", "referral", "Brand refresh and webshop", "₹3L", "10 weeks", W("rohan"), "normal", ago(14), CO("harbor"), CT("harbor1"), null, CO("harbor"), CT("harbor1"), ago(20)],
        [L("northwind"), O, "Isha K. — Northwind Wellness (Demo)", "isha@northwindwellness.example", null, "Northwind Wellness (Demo)", "converted", "website", "Brand refresh", "₹3.5L", "Q4", W("rohan"), "normal", ago(30), CO("northwind"), CT("northwind1"), null, CO("northwind"), CT("northwind1"), ago(40)],
        [L("web2"), O, "Rahul T. — Tidal Fitness (Demo)", "rahul@tidalfitness.example", "+91 90000 00099", "Tidal Fitness", "new", "website", "App + marketing site", "₹4L", "3 months", null, "normal", null, null, null, null, null, null, ago(2)],
      ]
    )
  );
  add(
    insert(
      "public.cos_opportunities",
      ["id", "organization_id", "company_id", "contact_id", "lead_id", "title", "kind", "stage", "amount", "probability", "owner_worker_id", "expected_close_date", "stage_changed_at", "lost_reason", "created_at"],
      [
        [OP("kerala-renewal"), O, CO("kerala"), CT("kerala1"), null, "Kerala Spice — annual retainer renewal", "renewal", "negotiation", 540000, 70, W("asha"), dAhead(10), ago(3), null, ago(50)],
        [OP("kerala-shorts"), O, CO("kerala"), CT("kerala1"), null, "Kerala Spice — Shorts programme upsell", "upsell", "solution", 200000, null, W("rohan"), dAhead(30), ago(5), null, ago(20)],
        [OP("lakshmi"), O, CO("lakshmi"), CT("lakshmi1"), null, "Lakshmi Textiles — storefront rebuild", "new", "won", 650000, 100, W("asha"), dAgo(58), ago(58), null, ago(90)],
        [OP("northwind"), O, CO("northwind"), CT("northwind1"), L("northwind"), "Northwind Wellness — brand refresh", "new", "proposal", 320000, 40, W("rohan"), dAgo(3), ago(26), null, ago(40)],
        [OP("harbor"), O, CO("harbor"), CT("harbor1"), L("harbor"), "Harbor Coffee — brand refresh & webshop", "new", "discovery", null, null, W("rohan"), null, ago(14), null, ago(20)],
        [OP("oldmill"), O, CO("oldmill"), CT("oldmill1"), null, "Old Mill — catalogue refresh", "new", "lost", 180000, 0, W("asha"), dAgo(70), ago(70), "Went with a cheaper local studio", ago(120)],
        [OP("coastline"), O, null, null, null, "Coastline Resorts — brand film", "new", "qualify", 150000, null, W("rohan"), dAhead(25), ago(1), null, ago(1)],
      ]
    )
  );
  add(`UPDATE public.cos_leads SET converted_opportunity_id = ${lit(OP("harbor"))} WHERE id = ${lit(L("harbor"))};\nUPDATE public.cos_leads SET converted_opportunity_id = ${lit(OP("northwind"))} WHERE id = ${lit(L("northwind"))};\n`);
  const PR = (k: string) => demoId(`proposal:${k}`);
  const CN = (k: string) => demoId(`contract:${k}`);
  add(
    insert(
      "public.cos_proposals",
      ["id", "organization_id", "opportunity_id", "company_id", "title", "status", "amount", "valid_until", "sent_at", "sent_action_id"],
      [
        [PR("northwind"), O, OP("northwind"), CO("northwind"), "Northwind Wellness — brand refresh proposal", "sent", 320000, dAgo(2), ago(20), actionId("proposal-send-northwind")],
        [PR("kerala-renewal"), O, OP("kerala-renewal"), CO("kerala"), "Kerala Spice — retainer renewal proposal", "draft", 540000, dAhead(14), null, null],
        [PR("lakshmi"), O, OP("lakshmi"), CO("lakshmi"), "Lakshmi Textiles — storefront proposal", "accepted", 650000, dAgo(60), ago(75), actionId("proposal-send-lakshmi")],
      ]
    )
  );
  add(
    insert(
      "public.cos_contracts",
      ["id", "organization_id", "company_id", "opportunity_id", "proposal_id", "title", "status", "value", "signed_at", "start_date", "end_date", "signed_by_name", "sign_action_id"],
      [
        [CN("kerala"), O, CO("kerala"), null, null, "Kerala Spice — annual retainer 2025–26", "signed", 480000, ago(340), dAgo(340), dAhead(24), "Anjali Varma", actionId("contract-sign-kerala")],
        [CN("lakshmi"), O, CO("lakshmi"), OP("lakshmi"), PR("lakshmi"), "Lakshmi Textiles — storefront rebuild", "signed", 650000, ago(58), dAgo(58), dAhead(40), "Lakshmi Rao", actionId("contract-sign-lakshmi")],
        [CN("northwind"), O, CO("northwind"), OP("northwind"), PR("northwind"), "Northwind Wellness — brand refresh agreement", "sent", 320000, null, null, null, null, null],
        [CN("oldmill"), O, CO("oldmill"), null, null, "Old Mill — catalogue agreement", "cancelled", 180000, null, null, null, null, null],
      ]
    )
  );

  // governed ledger history (what makes the gated rows above legitimate) ---------------------------
  const history: Ledger[] = [
    { key: "proposal-send-northwind", type: "proposal.send", risk: "HIGH", requester: "rohan", approver: "founder", input: { proposalId: PR("northwind") }, status: "executed", daysAgo: 20 },
    { key: "proposal-send-lakshmi", type: "proposal.send", risk: "HIGH", requester: "asha", approver: "founder", input: { proposalId: PR("lakshmi") }, status: "executed", daysAgo: 75 },
    { key: "contract-sign-kerala", type: "contract.sign", risk: "CRITICAL", requester: "asha", approver: "founder", input: { contractId: CN("kerala"), signedByName: "Anjali Varma" }, status: "executed", daysAgo: 340 },
    { key: "contract-sign-lakshmi", type: "contract.sign", risk: "CRITICAL", requester: "asha", approver: "founder", input: { contractId: CN("lakshmi"), signedByName: "Lakshmi Rao" }, status: "executed", daysAgo: 58 },
    ...[1, 2, 3, 4, 5, 6].map<Ledger>((n) => ({ key: `invoice-issue-${n}`, type: "invoice.issue", risk: "HIGH", requester: "asha", approver: "founder", input: { invoiceId: demoId(`inv:${n}`) }, status: "executed", daysAgo: [55, 35, 50, 90, 3, 0][n - 1] })),
    ...[1, 2, 3].map<Ledger>((n) => ({ key: `payment-${n}`, type: "payment.record", risk: "HIGH", requester: "asha", approver: "founder", input: { invoiceId: demoId(`inv:${n === 3 ? 2 : 1}`), amount: [200000, 100000, 90000][n - 1], reference: `UTR-DEMO-${n}` }, status: "executed", daysAgo: [20, 1, 1][n - 1] })),
    { key: "publish-youtube", type: "content.publish", risk: "HIGH", requester: "rohan", approver: "founder", input: { contentId: demoId("content:youtube-trailer") }, status: "executed", daysAgo: 4 },
    { key: "ads-budget-meta", type: "ads.budget_change", risk: "HIGH", requester: "rohan", approver: "founder", input: { adCampaignId: demoId("ad:meta-leadgen"), proposedBudget: 5000 }, status: "executed", daysAgo: 16 },
  ];
  // pending approvals the founder can inspect (and, where executable, really approve)
  const pending: Ledger[] = [
    { key: "pending-proposal-send", type: "proposal.send", risk: "HIGH", requester: "rohan", input: { proposalId: PR("kerala-renewal") }, status: "pending", daysAgo: 1 },
    { key: "pending-invoice-issue", type: "invoice.issue", risk: "HIGH", requester: "asha", input: { invoiceId: demoId("inv:6") }, status: "pending", daysAgo: 2, agent: { role: "client_success", provider: "anthropic", model: "claude-sonnet-5-5" } },
    { key: "pending-publish", type: "content.publish", risk: "HIGH", requester: "rohan", input: { contentId: demoId("content:instagram-reel") }, status: "pending", daysAgo: 0, agent: { role: "growth_director", provider: "xai", model: "grok-4" } },
    { key: "pending-contract-sign", type: "contract.sign", risk: "CRITICAL", requester: "asha", input: { contractId: CN("northwind"), signedByName: "Isha Kapoor" }, status: "pending", daysAgo: 1 },
    { key: "pending-ads-budget", type: "ads.budget_change", risk: "HIGH", requester: "rohan", input: { adCampaignId: demoId("ad:meta-leadgen"), proposedBudget: 3500, reason: "Creative fatigue on ad A: cut budget 30% until the refresh ships" }, status: "pending", daysAgo: 0, agent: { role: "ads_manager", provider: "xai", model: "grok-4" } },
    { key: "pending-payment", type: "payment.record", risk: "HIGH", requester: "asha", input: { invoiceId: demoId("inv:3"), amount: 75000, reference: "UTR-DEMO-PENDING", method: "bank_transfer" }, status: "pending", daysAgo: 0, agent: { role: "client_success", provider: "openai", model: "gpt-5" } },
    { key: "pending-deploy", type: "deploy.production", risk: "CRITICAL", requester: "asha", input: { target: "rinads-website", note: "v2 release candidate (demo)" }, status: "pending", daysAgo: 0, agent: { role: "engineering_lead", provider: "anthropic", model: "claude-sonnet-5-5" } },
  ];
  add(insert("public.rinpo_actions", LEDGER_COLUMNS, [...history, ...pending].map(ledgerRow)));

  // delivery --------------------------------------------------------------------
  add(
    insert(
      "public.cos_projects",
      ["id", "organization_id", "company_id", "contract_id", "name", "kind", "status", "health", "owner_worker_id", "start_date", "due_date", "budget"],
      PROJECTS.map((p) => [P(p.key), O, p.company ? CO(p.company) : null, p.company === "kerala" ? CN("kerala") : p.company === "lakshmi" ? CN("lakshmi") : null, p.name, p.kind, p.status, p.health, W(p.owner), dAgo(45), p.due, p.budget])
    )
  );
  const M = (k: string) => demoId(`ms:${k}`);
  add(
    insert(
      "public.cos_milestones",
      ["id", "organization_id", "project_id", "name", "status", "due_date", "completed_at", "sort_order"],
      [
        [M("m1"), O, P("p1"), "Rough cut approved", "missed", dAgo(4), null, 1],
        [M("m2"), O, P("p1"), "Final master delivery", "planned", dAhead(14), null, 2],
        [M("m3"), O, P("p1"), "Social cut-downs", "planned", dAhead(9), null, 3],
        [M("m4"), O, P("p2"), "Design sign-off", "completed", dAgo(10), ago(10), 1],
        [M("m5"), O, P("p2"), "Checkout live", "active", dAhead(9), null, 2],
        [M("m6"), O, P("p3"), "Release candidate", "active", dAhead(5), null, 1],
        [M("m7"), O, P("p3"), "Public cutover (founder-approved)", "planned", dAhead(12), null, 2],
        [M("m8"), O, P("p4"), "Wave 1 content published", "completed", dAgo(1), ago(1), 1],
        [M("m9"), O, P("p4"), "Campaign launch", "planned", dAhead(10), null, 2],
      ]
    )
  );
  add(
    insert(
      "public.cos_tasks",
      ["id", "organization_id", "project_id", "milestone_id", "company_id", "title", "status", "priority", "assignee_worker_id", "estimate_hours", "due_at", "required_skills", "blocked_by", "completed_at", "ai_involved", "created_at", "updated_at"],
      TASKS.map((t) => {
        const project = PROJECTS.find((p) => p.key === t.project);
        return [T(t.key), O, t.project ? P(t.project) : null, t.milestone ? M(t.milestone) : null, t.company ? CO(t.company) : project?.company ? CO(project.company) : null, t.title, t.status, t.priority, t.assignee ? W(t.assignee) : null, t.est, t.due, textArr(t.skills ?? []), uuidArr((t.blockedBy ?? []).map(T)), t.done ?? null, t.ai ?? false, ago(12), t.done ?? ago(1)];
      })
    )
  );
  const D = (k: string) => demoId(`deliv:${k}`);
  add(
    insert(
      "public.cos_deliverables",
      ["id", "organization_id", "project_id", "milestone_id", "company_id", "task_id", "title", "status", "due_date", "submitted_at", "approved_at", "approved_by", "change_requests", "notes"],
      [
        [D("d1"), O, P("p1"), M("m1"), CO("kerala"), T("t04"), "Hero film — rough cut v2", "submitted", dAgo(4), ago(1), null, null, 3, "Three revision rounds so far (demo)"],
        [D("d2"), O, P("p1"), null, CO("kerala"), T("t02"), "Storyboard pack", "approved", dAgo(6), ago(5), ago(4), U("asha"), 1, null],
        [D("d3"), O, P("p1"), null, CO("kerala"), null, "Brand style guide", "draft", dAhead(8), null, null, null, 0, null],
        [D("d4"), O, P("p2"), M("m4"), CO("lakshmi"), null, "Storefront wireframes", "approved", dAgo(12), ago(11), ago(10), U("asha"), 0, null],
        [D("d5"), O, P("p2"), M("m5"), CO("lakshmi"), T("t10"), "Checkout flow prototype", "changes_requested", dAgo(2), ago(4), null, null, 2, "Coupon rules unclear (demo)"],
        [D("d6"), O, P("p4"), M("m8"), null, T("t18"), "Q4 campaign calendar", "approved", dAgo(3), ago(3), ago(2), U("rohan"), 0, null],
      ]
    )
  );
  add(
    insert(
      "public.operational_alerts",
      ["organization_id", "alert_type", "title", "message", "entity_type", "severity", "acknowledged"],
      [
        [O, "incident", "Staging webhook retries failing", "Payment webhook retries exceed the limit on the staging environment (demo incident).", "task", "critical", false],
        [O, "capacity", "Video editing queue over capacity", "Kabir Shah is booked at 115% of weekly capacity (demo).", "worker", "warning", false],
      ],
      "ON CONFLICT DO NOTHING"
    )
  );

  // finance ---------------------------------------------------------------------
  const INV = (n: number) => demoId(`inv:${n}`);
  const invoice = (n: number, number: string, co: string, project: string | null, contract: string | null, status: string, total: number, paid: number, issued: Raw | null, due: Raw, issueAction: string | null, desc: string): Value[] => {
    const subtotal = Math.round((total / 1.18) * 100) / 100;
    return [INV(n), O, CO(co), project ? P(project) : null, contract ? CN(contract) : null, number, status, total, paid, "INR", issued, due, subtotal, Math.round((total - subtotal) * 100) / 100, json([{ description: desc, quantity: 1, unitPrice: subtotal }]), issueAction];
  };
  add(
    insert(
      "public.cos_invoices",
      ["id", "organization_id", "company_id", "project_id", "contract_id", "number", "status", "amount", "amount_paid", "currency", "issued_at", "due_at", "subtotal", "tax_total", "line_items", "issue_action_id"],
      [
        invoice(1, "INV-DEMO-001", "lakshmi", "p2", "lakshmi", "paid", 300000, 300000, dAgo(55), dAgo(25), actionId("invoice-issue-1"), "Storefront rebuild — milestone 1"),
        invoice(2, "INV-DEMO-002", "kerala", "p1", "kerala", "partial", 180000, 90000, dAgo(35), dAgo(5), actionId("invoice-issue-2"), "Brand film — advance"),
        invoice(3, "INV-DEMO-003", "lakshmi", "p2", "lakshmi", "sent", 75000, 0, dAgo(50), dAgo(40), actionId("invoice-issue-3"), "Storefront rebuild — change requests"),
        invoice(4, "INV-DEMO-004", "oldmill", null, null, "sent", 30000, 0, dAgo(90), dAgo(72), actionId("invoice-issue-4"), "Catalogue photography"),
        invoice(5, "INV-DEMO-005", "kerala", "p1", "kerala", "sent", 120000, 0, dAgo(3), dAhead(12), actionId("invoice-issue-5"), "Brand film — milestone 2"),
        invoice(6, "INV-DEMO-006", "kerala", null, "kerala", "draft", 150000, 0, null, dAhead(30), null, "Retainer — next quarter"),
      ]
    )
  );
  add(
    insert(
      "public.cos_payments",
      ["id", "organization_id", "invoice_id", "company_id", "amount", "currency", "paid_at", "method", "reference", "approved_action_id", "recorded_by"],
      [
        [demoId("pay:1"), O, INV(1), CO("lakshmi"), 200000, "INR", prevMonth(9), "bank_transfer", "UTR-DEMO-1", actionId("payment-1"), U("tarun")],
        [demoId("pay:2"), O, INV(1), CO("lakshmi"), 100000, "INR", monthStart(1), "upi", "UTR-DEMO-2", actionId("payment-2"), U("tarun")],
        [demoId("pay:3"), O, INV(2), CO("kerala"), 90000, "INR", monthStart(2), "bank_transfer", "UTR-DEMO-3", actionId("payment-3"), U("tarun")],
      ]
    )
  );
  const exp = (n: number, dept: string, cat: string, amount: number, daysAgo: number, notes: string): Value[] => [demoId(`exp:${n}`), O, demoId(`dept:${dept}`), cat, amount, dAgo(daysAgo), notes];
  add(
    insert(
      "public.cos_expenses",
      ["id", "organization_id", "department_id", "category", "amount", "incurred_at", "notes"],
      [
        exp(1, "engineering", "tools", 18500, 2, "Hosting & database (demo)"),
        exp(2, "studio", "tools", 24000, 3, "Creative software subscriptions (demo)"),
        exp(3, "ai_automation", "ai_usage", 9200, 4, "AI provider usage (demo)"),
        exp(4, "studio", "contractor", 45000, 5, "Freelance motion artist (demo)"),
        exp(5, "advertising", "ad_spend", 62000, 6, "Paid media — monsoon campaign (demo)"),
        exp(6, "finance_admin", "admin", 12000, 8, "Accounting & compliance (demo)"),
        exp(7, "people_culture", "training", 8000, 9, "Academy lab materials (demo)"),
        exp(8, "engineering", "tools", 17800, 31, "Hosting & database — previous month (demo)"),
        exp(9, "studio", "tools", 24000, 33, "Creative software — previous month (demo)"),
        exp(10, "advertising", "ad_spend", 58000, 36, "Paid media — previous month (demo)"),
      ]
    )
  );
  add(
    insert(
      "public.cos_daily_closings",
      ["organization_id", "worker_id", "closing_date", "completed", "pending", "blocked", "tomorrow_priority", "submitted_at"],
      [
        [O, W("kabir"), dAgo(1), "Cut sequence A and B", "Sequence C", "Waiting on final VO", "Finish rough cut", ago(1)],
        [O, W("nikhil"), dAgo(1), "Coupon rule analysis", "Fix + tests", "Client sandbox keys", "Ship coupon fix", ago(1)],
      ]
    )
  );

  // Studio / growth / ads -----------------------------------------------------------
  const CAMP = demoId("camp:monsoon");
  const JOB = demoId("job:monsoon");
  const A = (k: string) => demoId(`asset:${k}`);
  add(
    insert(
      "public.growth_campaigns",
      ["id", "organization_id", "company_id", "name", "objective", "status", "channels", "budget", "start_date", "end_date", "owner_id"],
      [[CAMP, O, CO("kerala"), "Monsoon Festival 2026 — Kerala Spice (Demo)", "Drive 400 qualified leads for the festival range", "active", textArr(["youtube", "youtube_shorts", "instagram", "linkedin", "blog", "google_business", "whatsapp", "paid_ads"]), 250000, dAgo(10), dAhead(20), U("rohan")]]
    )
  );
  add(
    insert(
      "public.studio_jobs",
      ["id", "organization_id", "company_id", "campaign_id", "project_id", "title", "stage", "status", "brief", "brief_complete", "completed_stages", "qa_passed", "approved", "client_facing", "owner_id", "due_date", "stage_entered_at"],
      [
        [JOB, O, CO("kerala"), CAMP, P("p1"), "Monsoon Festival hero film + social variants", "approval", "open", json({ audience: "Urban families 28–45", message: "Taste the rains", tone: "Warm, festive" }), true, textArr(["request", "brief", "strategy", "creative_direction", "copy_script", "storyboard", "design", "image", "video", "animation", "audio_voice", "edit", "qa"]), true, false, true, U("asha"), dAhead(6), ago(1)],
        [demoId("job:logo"), O, CO("lakshmi"), null, P("p2"), "Lakshmi Textiles — festive banner pack", "performance", "done", json({ audience: "Existing customers" }), true, textArr(["request", "brief", "design", "qa", "approval", "master", "variants", "publish"]), true, true, true, U("divya"), dAgo(10), ago(8)],
        [demoId("job:academy"), O, null, null, P("p5"), "Academy cohort 3 promo teaser", "brief", "open", json({ audience: "Prospective students" }), false, textArr(["request"]), false, false, false, U("rohan"), dAhead(18), ago(2)],
      ]
    )
  );
  const asset = (k: string, kind: string, title: string, role: string, parent: string | null, creator: string, userKey: string | null, provider: string | null, model: string | null, promptRef: string | null, source: string, license: string | null, status: string, channel: string | null, version = 1): Value[] => [
    A(k), O, JOB, CO("kerala"), CAMP, P("p1"), parent ? A(parent) : null, kind, title, version, role, creator, userKey ? U(userKey) : null, provider, model, promptRef, source, license, status, status === "approved" ? U("asha") : null, status === "approved" ? ago(1) : null, channel, `demo-storage/${k}`,
  ];
  add(
    insert(
      "public.creative_assets",
      ["id", "organization_id", "studio_job_id", "company_id", "campaign_id", "project_id", "parent_asset_id", "kind", "title", "version", "role", "creator_kind", "creator_user_id", "ai_provider", "ai_model", "prompt_ref", "source_kind", "license_terms", "approval_status", "approved_by", "approved_at", "channel", "storage_path"],
      [
        asset("script", "script", "Hero film script v3", "working", null, "human", "meera", null, null, null, "original", null, "approved", null, 3),
        asset("storyboard", "storyboard", "Storyboard frames (24)", "working", null, "hybrid", "divya", "openai", "gpt-image-1", "prompt:storyboard-v2#7f3c", "ai_generated", "Provider terms: commercial use permitted (demo)", "approved", null),
        asset("master", "video", "Hero film — master 4K", "master", null, "hybrid", "kabir", "xai", "grok-imagine", "prompt:hero-b-roll-v3#a1b2", "ai_generated", "Provider terms: commercial use permitted (demo)", "approved", null),
        asset("reel", "video", "Instagram Reel 9:16", "variant", "master", "human", "kabir", null, null, null, "original", null, "approved", "instagram"),
        asset("shorts", "video", "YouTube Shorts 9:16", "variant", "master", "human", "kabir", null, null, null, "original", null, "submitted", "youtube_shorts"),
        asset("linkedin", "video", "LinkedIn 1:1 cut", "variant", "master", "human", "kabir", null, null, null, "original", null, "draft", "linkedin"),
        asset("thumb", "image", "Thumbnail set", "working", null, "human", "divya", null, null, null, "stock", "Stock licence #DEMO-4411 (royalty-free)", "rejected", null),
        asset("trailer", "video", "YouTube trailer cut", "master", null, "human", "kabir", null, null, null, "original", null, "approved", null),
      ]
    )
  );
  const CI = (k: string) => demoId(`content:${k}`);
  const IDEA = demoId("idea:monsoon");
  add(
    insert(
      "public.content_items",
      ["id", "organization_id", "campaign_id", "source_idea_id", "asset_id", "channel", "status", "title", "body_ref", "scheduled_at", "published_at", "external_url", "publish_action_id"],
      [
        [IDEA, O, CAMP, IDEA, A("master"), "web", "approved", "Monsoon Festival — hero film landing page", null, null, null, null, null],
        [CI("youtube-trailer"), O, CAMP, IDEA, A("trailer"), "youtube", "published", "YouTube — 60s festival trailer", null, null, ago(4), "https://video.example/watch/DEMO-TRAILER", actionId("publish-youtube")],
        [CI("shorts"), O, CAMP, IDEA, A("shorts"), "youtube_shorts", "scheduled", "YouTube Shorts — 15s teaser (planned, not published)", null, ahead(2), null, null, null],
        [CI("instagram-reel"), O, CAMP, IDEA, A("reel"), "instagram", "approved", "Instagram Reel — festival teaser (approved, awaiting publish approval)", null, null, null, null, null],
        [CI("linkedin"), O, CAMP, IDEA, A("linkedin"), "linkedin", "in_review", "LinkedIn — behind-the-scenes cut", null, null, null, null, null],
        [CI("blog"), O, CAMP, IDEA, null, "blog", "drafting", "Blog — 5 monsoon recipes to pair with the film", "docs/demo/blog-monsoon", null, null, null, null],
        [CI("gbp"), O, CAMP, IDEA, null, "google_business", "idea", "Google Business — festival offer post", null, null, null, null, null],
        [CI("whatsapp"), O, CAMP, IDEA, null, "whatsapp", "drafting", "WhatsApp broadcast DRAFT — NOT SENT (no provider connected)", null, null, null, null, null],
        [CI("seo"), O, CAMP, IDEA, null, "blog", "idea", "SEO task — keyword brief: 'monsoon recipes kerala'", null, null, null, null, null],
      ]
    )
  );
  add(
    insert(
      "public.asset_publications",
      ["id", "organization_id", "asset_id", "content_item_id", "channel", "status", "published_at", "external_url", "approved_action_id"],
      [[demoId("pub:youtube"), O, A("trailer"), CI("youtube-trailer"), "youtube", "published", ago(4), "https://video.example/watch/DEMO-TRAILER", actionId("publish-youtube")]]
    )
  );
  add(
    insert(
      "public.asset_performance",
      ["organization_id", "asset_id", "publication_id", "metric_date", "impressions", "views", "clicks", "conversions", "spend", "source"],
      [0, 1, 2, 3].map((d) => [O, A("trailer"), demoId("pub:youtube"), dAgo(d), 4200 - d * 600, 2900 - d * 420, 310 - d * 40, 22 - d * 4, 0, "manual"])
    )
  );
  const AD = demoId("ad:meta-leadgen");
  add(
    insert(
      "public.ad_campaigns",
      ["id", "organization_id", "campaign_id", "platform", "external_id", "name", "status", "objective", "landing_page", "daily_budget", "currency", "budget_action_id"],
      [
        [AD, O, CAMP, "meta", "demo-meta-1", "Monsoon Festival — Lead Gen (Meta)", "active", "Lead generation", "https://keralaspice.example/monsoon", 5000, "INR", actionId("ads-budget-meta")],
        [demoId("ad:google-brand"), O, CAMP, "google", "demo-google-1", "Brand search — Kerala Spice (Google)", "paused", "Brand defence", "https://keralaspice.example", null, "INR", null],
      ]
    )
  );
  const metricRows: Value[][] = [];
  for (let d = 0; d < 21; d++) {
    // Ad A — "Taste the rains": strong early, fatigues (frequency up, CTR down, cost per lead up) over the last week.
    const fatigue = d < 8 ? 8 - d : 0;
    metricRows.push([O, AD, "ad-a", "A — Hook: Taste the rains", dAgo(d), 1800 + fatigue * 60, 52000 - fatigue * 3000, Math.round(1100 - fatigue * 95), Math.max(9, 38 - fatigue * 3), 1.6 + fatigue * 0.45, "Taste the rains", "Women 28–45, Kochi", "https://keralaspice.example/monsoon"]);
    metricRows.push([O, AD, "ad-b", "B — Hook: Grandma's recipe", dAgo(d), 1500, 41000, 1250, 52 + (d % 3), 1.4, "Grandma's recipe", "Women 35–55, Kerala", "https://keralaspice.example/monsoon"]);
    metricRows.push([O, AD, "ad-c", "C — Hook: 20% festival offer", dAgo(d), 900, 30000, 420, 14, 1.3, "20% festival offer", "Men 25–40, Kochi", "https://keralaspice.example/offer-old"]);
  }
  add(insert("public.ad_metrics_daily", ["organization_id", "ad_campaign_id", "ad_id", "ad_name", "metric_date", "spend", "impressions", "clicks", "conversions", "frequency", "hook", "audience", "landing_page"], metricRows));

  // communications -------------------------------------------------------------
  const comm = (channel: string, direction: string, status: string, subject: string, summary: string, daysAgo: number, type: string | null, link: string | null): Value[] => [O, channel, direction, status, subject, summary, ago(daysAgo), type, link];
  add(
    insert(
      "public.comm_activities",
      ["organization_id", "channel", "direction", "status", "subject", "summary", "occurred_at", "linked_type", "linked_id"],
      [
        comm("call", "outbound", "logged", "Intro call — Bluebird Pharma", "Discussed explainer series scope.", 3, "lead", L("bluebird")),
        comm("whatsapp", "inbound", "logged", "Kerala Spice asks about Shorts pricing", "Anjali asked for a Shorts programme quote.", 2, "company", CO("kerala")),
        comm("email", "outbound", "delivered", "Proposal sent — Northwind Wellness", "Brand refresh proposal v1.", 20, "opportunity", OP("northwind")),
        comm("email", "outbound", "failed", "Invoice reminder bounced — INV-DEMO-004", "Recipient mailbox full (demo exception).", 1, "invoice", INV(4)),
        comm("sms", "outbound", "delivered", "Payment reminder — INV-DEMO-003", "Reminder sent to Lakshmi Textiles.", 4, "invoice", INV(3)),
        comm("call", "inbound", "missed", "Missed call — Lakshmi Textiles", "Client called about the checkout bug.", 0, "project", P("p2")),
        comm("web_chat", "inbound", "logged", "Website chat — Tidal Fitness", "Asked for an app + website quote.", 2, "lead", L("web2")),
        comm("meeting", "outbound", "logged", "Internal: release readiness sync", "Reviewed the v2 release checklist (internal notification).", 1, "project", P("p3")),
        comm("whatsapp", "outbound", "logged", "Client review reminder", "Reminder to review the rough cut (logged only; nothing was sent).", 1, "project", P("p1")),
        comm("voice", "inbound", "logged", "RINPO Phone — Harbor Coffee enquiry", "Voice enquiry captured by RINPO (demo).", 5, "contact", CT("harbor1")),
      ]
    )
  );

  // academy ---------------------------------------------------------------------
  const SK = (k: string) => demoId(`skill:${k}`);
  add(
    insert(
      "public.academy_skills",
      ["id", "organization_id", "skill_key", "name", "description"],
      [
        [SK("design"), O, "design", "Design", "Visual design for brand and web"],
        [SK("video_editing"), O, "video_editing", "Video editing", "Edit, grade and deliver film"],
        [SK("motion"), O, "motion", "Motion & animation", "2D/3D motion graphics"],
        [SK("copywriting"), O, "copywriting", "Copywriting", "Scripts, captions and long-form"],
        [SK("ads"), O, "ads", "Paid media", "Meta/Google ads and analysis"],
      ]
    )
  );
  add(
    insert(
      "public.academy_progress",
      ["organization_id", "user_id", "skill_id", "stage", "evidence", "assessed_by", "certified_at"],
      [
        [O, U("divya"), SK("design"), "certified", json([{ note: "Completed 3 supervised client projects", at: "demo" }, { note: "Assessment passed", at: "demo" }]), U("asha"), ago(30)],
        [O, U("kabir"), SK("video_editing"), "certified", json([{ note: "Supervised work: hero film assembly", at: "demo" }]), U("asha"), ago(60)],
        [O, U("kabir"), SK("motion"), "supervised_work", json([{ note: "Lab 2 complete", at: "demo" }]), null, null],
        [O, U("meera"), SK("copywriting"), "assessment", json([{ note: "Portfolio submitted", at: "demo" }]), null, null],
        [O, U("sana"), SK("ads"), "practice", json([]), null, null],
        [O, U("nikhil"), SK("design"), "learn", json([]), null, null],
      ]
    )
  );

  // AI -------------------------------------------------------------------------
  const runs: Value[][] = [];
  const combos: [string, string, string, string, number][] = [
    ["xai", "grok-4", "founder_chief_of_staff", "reasoning", 0.021],
    ["anthropic", "claude-sonnet-5-5", "operations_controller", "reasoning", 0.034],
    ["openai", "gpt-5", "sales_intelligence", "reasoning", 0.027],
    ["xai", "grok-4", "trend_intelligence", "research", 0.018],
    ["anthropic", "claude-sonnet-5-5", "engineering_lead", "code", 0.045],
    ["openai", "gpt-image-1", "ai_production_lead", "vision", 0.04],
  ];
  for (let i = 0; i < 36; i++) {
    const [provider, model, role, task, cost] = combos[i % combos.length];
    const failed = i === 7 || i === 19 || i === 28;
    const blocked = i === 13;
    runs.push([O, U(["founder", "asha", "rohan"][i % 3]), role, provider, model, task, blocked ? "restricted" : "internal", blocked ? "blocked" : failed ? "failed" : "succeeded", 900 + i * 31, 300 + i * 17, blocked || failed ? null : Math.round(cost * (1 + (i % 4) * 0.2) * 1e6) / 1e6, 800 + i * 40, failed ? "provider_timeout" : blocked ? "policy_blocked" : null, blocked ? "Restricted data stays on the deterministic path" : "Task-aware routing", `demo-run-${i}`, null, raw(`now() - interval '${Math.round(i * 9.5)} hours'`)]);
  }
  add(insert("public.ai_runs", ["organization_id", "user_id", "agent_role", "provider", "model", "task_kind", "sensitivity", "status", "input_tokens", "output_tokens", "cost_usd", "latency_ms", "error_class", "routing_reason", "correlation_id", "action_id", "started_at"], runs));
  add(
    insert(
      "public.ai_agent_profiles",
      ["organization_id", "role_key", "enabled", "allowed_providers", "max_sensitivity", "notes"],
      [
        [O, "founder_chief_of_staff", true, textArr([]), "confidential", "Routing decided by RINADS Intelligence"],
        [O, "ads_manager", true, textArr(["xai", "anthropic"]), "internal", "Proposes budget changes only"],
        [O, "engineering_lead", true, textArr(["anthropic"]), "internal", "Read-only on engineering signals"],
        [O, "trend_intelligence", false, textArr(["xai"]), "public", "Disabled until a research policy is agreed"],
      ]
    )
  );

  // logistics (existing commerce tables; no carrier is contacted) ---------------------------
  const LOC = demoId("loc:main");
  add(`INSERT INTO public.inventory_locations (id, organization_id, name, code) VALUES (${lit(LOC)}, ${lit(O)}, 'Demo warehouse', 'DEMO-WH') ON CONFLICT DO NOTHING;\n`);
  const orderRows: Value[][] = [];
  const fulfilRows: Value[][] = [];
  const packRows: Value[][] = [];
  const shipRows: Value[][] = [];
  const shipments: [string, string, string, number | null, number | null, string][] = [
    ["delivered", "DEMO-1001", "delivered", 8, 5, "Merch order — delivered"],
    ["delayed", "DEMO-1002", "in_transit", 9, null, "Merch order — delayed in transit"],
    ["exception", "DEMO-1003", "exception", 6, null, "Merch order — carrier exception (address)"],
  ];
  for (const [k, orderNo, status, shippedAgo, deliveredAgo] of shipments) {
    orderRows.push([demoId(`order:${k}`), O, orderNo, k === "delivered" ? "completed" : "placed", "paid", k === "delivered" ? "fulfilled" : "partially_fulfilled", 4200, 0, 150, 0, 4350, "INR", `buyer-${k}@demo.example`]);
    fulfilRows.push([demoId(`ful:${k}`), O, demoId(`order:${k}`), "completed", LOC]);
    packRows.push([demoId(`pkg:${k}`), O, demoId(`order:${k}`), demoId(`ful:${k}`), "box", 1200]);
    shipRows.push([demoId(`ship:${k}`), O, demoId(`order:${k}`), demoId(`pkg:${k}`), k === "exception" ? "BlueStar (demo)" : "SwiftCargo (demo)", "standard", `DEMOAWB${orderNo.slice(-4)}`, status, ago(shippedAgo as number), deliveredAgo ? ago(deliveredAgo) : null]);
  }
  add(insert("public.orders", ["id", "organization_id", "order_number", "status", "payment_status", "fulfilment_status", "subtotal", "discount_total", "shipping_total", "tax_total", "grand_total", "currency", "guest_email"], orderRows));
  add(insert("public.fulfilments", ["id", "organization_id", "order_id", "status", "location_id"], fulfilRows));
  add(insert("public.packages", ["id", "organization_id", "order_id", "fulfilment_id", "package_type", "weight_grams"], packRows));
  add(insert("public.shipments", ["id", "organization_id", "order_id", "package_id", "carrier", "service", "awb", "status", "shipped_at", "delivered_at"], shipRows));
  add(
    insert(
      "public.delivery_events",
      ["shipment_id", "event_type", "label", "occurred_at"],
      [
        [demoId("ship:delivered"), "delivered", "Delivered to recipient", ago(5)],
        [demoId("ship:delayed"), "in_transit", "Arrived at regional hub; onward leg delayed", ago(4)],
        [demoId("ship:exception"), "exception", "Delivery attempt failed: address incomplete", ago(3)],
      ]
    )
  );

  // a second, unrelated tenant for cross-tenant isolation checks ----------------------------
  add(insert("public.profiles", ["id", "display_name"], []));
  add(
    insert(
      "public.cos_companies",
      ["id", "organization_id", "name", "lifecycle_stage", "priority"],
      [[demoId("co:other-secret"), O2, "OTHER-TENANT-SECRET Holdings (Demo)", "client", "strategic"]]
    )
  );
  add(
    insert(
      "public.cos_invoices",
      ["id", "organization_id", "company_id", "number", "status", "amount", "issued_at", "due_at", "issue_action_id"],
      [[demoId("inv:other"), O2, demoId("co:other-secret"), "OTHER-INV-999", "sent", 999999, dAgo(90), dAgo(80), null]]
    )
  );

  return out.filter(Boolean).join("\n");
}

/** SQL that creates the persona logins in a Supabase Auth database. Passwords are supplied by the caller and never stored. */
export function buildPersonaSql(passwords: Record<string, string>): string {
  const rows = PERSONAS.map((p) => {
    const pw = passwords[p.key];
    if (!pw) throw new Error(`missing password for ${p.key}`);
    return { p, pw };
  });
  const values = rows.map(({ p, pw }) => `(${lit(personaId(p.key))}::uuid, ${lit(p.email)}, ${lit(pw)}, ${lit(p.name)})`).join(",\n  ");
  return `-- Synthetic persona logins for the PREVIEW database only. Run once, then discard this script.
DO $personas$
BEGIN
  IF coalesce(current_setting('rinads.allow_demo_seed', true), '') <> 'yes' THEN
    RAISE EXCEPTION 'Refused: set rinads.allow_demo_seed = ''yes'' first (preview databases only).';
  END IF;
END
$personas$;
WITH src(id, email, pw, name) AS (VALUES
  ${values}
), u AS (
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  SELECT '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, extensions.crypt(pw, extensions.gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('display_name', name, 'synthetic_demo', true), now(), now(), '', '', '', ''
  FROM src
  ON CONFLICT (id) DO NOTHING
  RETURNING id, email
)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now(), now()
FROM u
ON CONFLICT DO NOTHING;
`;
}
