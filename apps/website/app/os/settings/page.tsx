import { ACTION_CATALOG, can } from "@rinads/company-os-engine";
import { loadActionPolicy } from "@rinads/company-os-server";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { guard } from "@/components/os/company/guard";
import { Badge, Metric, MetricGrid, OsPage, Panel, Table } from "@/components/os/company/ui";
import { getEngineeringConfigState } from "@/lib/company-os/engineering";
import { createSiteLeadSource } from "@/lib/company-os/site-leads";
import { titleCase } from "@/lib/company-os/format";
import { getSettingsModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";
const RISK = { LOW: "neutral", MEDIUM: "info", HIGH: "warn", CRITICAL: "bad" } as const;

export default async function SettingsPage() {
  // Settings stays reachable for every member (legacy bridge below); policy and catalogue need org.manage.
  const g = await guard("/os/settings", null, "Settings");
  if (!g.ok) return g.block;
  const { session } = g.data;
  const admin = can(session.ctx, "org.manage") || can(session.ctx, "org.members.manage");
  const policy = admin ? await loadActionPolicy(session.db, session.ctx.organizationId) : null;
  const eng = getEngineeringConfigState();
  const siteLeads = !!createSiteLeadSource(session.ctx.organizationId);

  return (
    <OsPage title="Settings" eyebrow="Governance" summary="How this organisation's governed actions behave, and which integrations are configured. Values are read-only here: changing policy, roles, secrets or authentication is a founder-approved operation outside the Company OS.">
      <Panel id="you" title="Your access">
        <p className="text-sm text-gray-700">Role <Badge>{titleCase(session.ctx.roleKey ?? "member")}</Badge> with {session.ctx.permissions.length} permissions. The database enforces these per organisation regardless of what this interface shows.</p>
      </Panel>
      {policy && (
        <Panel id="policy" title="Approval policy" subtitle="From tenant policy 'company_os.actions'; stricter defaults apply when none is set">
          <MetricGrid>
            <Metric label="Distinct approver" value={policy.requireDistinctApprover ? "Required" : "Not required"} hint="CRITICAL actions always require someone else" />
            <Metric label="Approval expiry" value={`${policy.approvalTtlHours}h`} />
            <Metric label="Payments escalate at" value={policy.criticalPaymentAmount === null ? "Never (by amount)" : String(policy.criticalPaymentAmount)} />
            <Metric label="Ad budget limit" value={`${policy.budget.maxAutoChangePct}% change`} hint={policy.budget.highBudgetThreshold === null ? "No absolute ceiling" : `Ceiling ${policy.budget.highBudgetThreshold}`} />
          </MetricGrid>
        </Panel>
      )}
      {admin && (
        <Panel id="integrations" title="Integrations" subtitle="Configured / not configured only; credentials are never displayed">
          <Table
            caption="Integrations"
            rows={[
              { name: "GitHub (read-only)", on: eng.github },
              { name: "Vercel (read-only)", on: eng.vercel },
              { name: "Supabase health", on: eng.supabase },
              { name: "Website lead import", on: siteLeads },
            ]}
            columns={[{ header: "Integration", cell: (r) => r.name }, { header: "State", cell: (r) => <Badge tone={r.on ? "good" : "neutral"}>{r.on ? "configured" : "not configured"}</Badge> }]}
          />
        </Panel>
      )}
      {admin && (
        <Panel id="catalogue" title="Action catalogue" subtitle="Every action the Company OS can run, its risk and whether an approver is needed">
          <Table
            caption="Action catalogue"
            rows={ACTION_CATALOG as unknown as (typeof ACTION_CATALOG)[number][]}
            columns={[
              { header: "Action", cell: (a) => <><span className="font-semibold">{a.label}</span><br /><span className="text-xs text-gray-500">{a.key}</span></> },
              { header: "Risk", cell: (a) => <Badge tone={RISK[a.risk]}>{a.risk}</Badge> },
              { header: "Approval", cell: (a) => (a.executable === false ? <Badge tone="bad">not executable here</Badge> : a.approval === "always" ? "Always" : "By risk and policy") },
              { header: "Needs", cell: (a) => <code className="text-xs">{a.requiredPermission}</code> },
              { header: "AI may propose", cell: (a) => (a.agentMayPropose ? "Yes" : "No") },
            ]}
          />
        </Panel>
      )}
      <OsModuleBridge config={getSettingsModuleDestinations()} />
    </OsPage>
  );
}
