import { isAvailable } from "@rinads/company-os-engine";
import { loadActionHistory } from "@rinads/company-os-server";
import { guard } from "@/components/os/company/guard";
import { PendingApprovals } from "@/components/os/company/sections";
import { Badge, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDateTime, titleCase } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";

export const dynamic = "force-dynamic";
const TONE = { executed: "good", failed: "bad", rejected: "warn", approved: "info" } as const;

export default async function ApprovalsPage() {
  const g = await guard("/os/approvals", "approvals.read", "Approvals");
  if (!g.ok) return g.block;
  const { facts, snapshot, session, now } = g.data;
  const history = await loadActionHistory(session.db, session.ctx);
  const names = memberNames(facts);

  return (
    <OsPage title="Approvals" eyebrow="Governance" summary="Every consequential action — by a person or an AI role — is requested, approved by someone else, executed, verified and recorded here. AI roles only ever propose.">
      <Panel id="pending" title="Waiting for a decision">
        {isAvailable(snapshot.approvals) && (
          <div className="mb-3">
            <MetricGrid>
              <Metric label="Pending" value={snapshot.approvals.data.pending} />
              <Metric label="Waiting over 24h" value={snapshot.approvals.data.aged} tone={snapshot.approvals.data.aged > 0 ? "warn" : undefined} />
              <Metric label="High / critical" value={snapshot.approvals.data.highRisk} />
              <Metric label="Prepared by AI roles" value={snapshot.approvals.data.preparedByAgents} />
            </MetricGrid>
          </div>
        )}
        <SectionGate section={facts.approvals} label="Approvals">{(rows) => <PendingApprovals approvals={rows} ctx={session.ctx} now={now} />}</SectionGate>
      </Panel>

      <Panel id="history" title="Recent decisions and executions" subtitle="The last 100 governed actions that are no longer pending">
        <SectionGate section={history} label="Action history">
          {(rows) => (
            <Table
              caption="Governed action history"
              rows={rows}
              columns={[
                { header: "When", cell: (a) => formatDateTime(a.requestedAt) },
                { header: "Action", cell: (a) => a.summary },
                { header: "Risk", cell: (a) => <Badge tone={a.risk === "CRITICAL" ? "bad" : a.risk === "HIGH" ? "warn" : "neutral"}>{a.risk}</Badge> },
                { header: "Outcome", cell: (a) => <Badge tone={TONE[a.status as keyof typeof TONE] ?? "neutral"}>{titleCase(a.status)}</Badge> },
                { header: "By", cell: (a) => (a.actorKind === "agent" ? `AI role: ${titleCase(a.agentRole ?? "unknown")}` : nameOf(names, a.requestedBy)) },
                { header: "Approver", cell: (a) => (a.decidedBy ? nameOf(names, a.decidedBy) : "—") },
                { header: "Failure", cell: (a) => a.error ?? "—" },
              ]}
            />
          )}
        </SectionGate>
      </Panel>
    </OsPage>
  );
}
