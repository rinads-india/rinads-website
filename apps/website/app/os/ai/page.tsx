import { AGENT_ROLES, can, isAvailable, type AgentRoleProfile } from "@rinads/company-os";
import { loadAiDetail } from "@rinads/company-os-server";
import { listRinpoModelRegistry, selectRinpoModel } from "@rinads/intelligence/model-registry";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDateTime, titleCase } from "@/lib/company-os/format";
import { n, s, sn } from "@/lib/company-os/rows";

export const dynamic = "force-dynamic";

function route(role: AgentRoleProfile) {
  const sel = selectRinpoModel(role.taskKind, role.maxSensitivity);
  return sel.mode === "model" ? `${sel.route.provider} / ${sel.route.model}` : "Deterministic (no external model)";
}

export default async function AiPage() {
  const g = await guard("/os/ai", "ai.read", "AI");
  if (!g.ok) return g.block;
  const { session, now } = g.data;
  const detail = await loadAiDetail(session.db, session.ctx, now);
  const registry = listRinpoModelRegistry();
  const canSee = can(session.ctx, "ai.read");

  return (
    <OsPage title="AI" eyebrow="RINADS Intelligence" summary="The AI workforce is a set of configurable roles on top of RINADS Intelligence. Providers such as Grok, Claude, OpenAI or Google are replaceable workers; they never hold permissions, tenancy or business state, and in this release roles only read and propose.">
      <Panel id="providers" title="Providers" subtitle="Server-side configuration state; keys are never exposed">
        <Table
          caption="Model providers"
          rows={registry}
          columns={[
            { header: "Provider", cell: (r) => r.provider },
            { header: "Model", cell: (r) => r.model || "—" },
            { header: "State", cell: (r) => <Badge tone={r.configured ? "good" : "neutral"}>{r.configured ? "configured" : "not configured"}</Badge> },
            { header: "Default", cell: (r) => (r.selectedByDefault ? "Yes" : "") },
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">When no provider is configured, RINPO answers from deterministic company data only. Restricted data never leaves the deterministic path.</p>
      </Panel>

      <Panel id="roles" title="Roles" subtitle="Each role is configuration: what it may read, what it may prepare, and which model task kind it routes">
        <Table
          caption="AI roles"
          rows={AGENT_ROLES as AgentRoleProfile[]}
          columns={[
            { header: "Role", cell: (r) => <><span className="font-semibold">{r.label}</span><br /><span className="text-xs text-gray-500">{r.purpose}</span></> },
            { header: "May prepare (approval-gated)", cell: (r) => <span className="text-xs">{r.mayPrepare.join(", ")}</span> },
            { header: "Routes to", cell: (r) => <span className="text-xs">{titleCase(r.taskKind)} · ≤ {r.maxSensitivity}<br />{route(r)}</span> },
            { header: "Autonomy", cell: (r) => <Badge tone="info">{r.autonomy}</Badge> },
          ]}
        />
      </Panel>

      <Panel id="runs" title="Runs and cost" subtitle="Last 30 days from the AI run ledger">
        <SectionGate section={detail.runs} label="AI runs">
          {(rows) => {
            const failed = rows.filter((r) => s(r, "status") !== "succeeded");
            const cost = rows.reduce((a, r) => a + (n(r, "cost_usd") ?? 0), 0);
            const unknownCost = rows.filter((r) => n(r, "cost_usd") === null).length;
            return (
              <>
                <MetricGrid>
                  <Metric label="Runs" value={rows.length} />
                  <Metric label="Failed / blocked" value={failed.length} tone={failed.length > 0 ? "warn" : undefined} />
                  <Metric label="Recorded cost (USD)" value={cost.toFixed(2)} hint={unknownCost ? `${unknownCost} run(s) without cost data` : undefined} />
                </MetricGrid>
                <div className="mt-3">
                  <Table
                    caption="Recent AI runs"
                    rows={rows.slice(0, 50)}
                    empty={<Empty title="No AI runs recorded" hint="Runs appear here once RINPO or a role calls a model through RINADS Intelligence." />}
                    columns={[
                      { header: "When", cell: (r) => formatDateTime(s(r, "started_at")) },
                      { header: "Role", cell: (r) => titleCase(sn(r, "agent_role") ?? "rinpo") },
                      { header: "Provider / model", cell: (r) => `${s(r, "provider")} / ${s(r, "model")}` },
                      { header: "Status", cell: (r) => <Badge tone={s(r, "status") === "succeeded" ? "good" : "bad"}>{titleCase(s(r, "status"))}</Badge> },
                      { header: "Cost", cell: (r) => (n(r, "cost_usd") === null ? "—" : `$${(n(r, "cost_usd") ?? 0).toFixed(4)}`) },
                      { header: "Error class", cell: (r) => sn(r, "error_class") ?? "—" },
                    ]}
                  />
                </div>
              </>
            );
          }}
        </SectionGate>
      </Panel>

      {canSee && isAvailable(detail.profiles) && detail.profiles.data.length > 0 && (
        <Panel id="profiles" title="Role overrides" subtitle="Tenant-specific configuration">
          <Table caption="Role overrides" rows={detail.profiles.data} columns={[{ header: "Role", cell: (r) => titleCase(s(r, "role_key")) }, { header: "Enabled", cell: (r) => (r.enabled === false ? "No" : "Yes") }]} />
        </Panel>
      )}
    </OsPage>
  );
}
