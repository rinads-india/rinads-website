import { OPPORTUNITY_MACHINE, can, canTransition, isAvailable, summarizePipeline, type OpportunityStage } from "@rinads/company-os-engine";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, Empty, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { createSiteLeadSource } from "@/lib/company-os/site-leads";
import { formatDate, formatMoney, titleCase } from "@/lib/company-os/format";
import { companyOptions, opportunityOptions } from "@/lib/company-os/options";

export const dynamic = "force-dynamic";
const FORWARD: OpportunityStage[] = ["solution", "proposal", "negotiation", "won"];

export default async function SalesPage() {
  const g = await guard("/os/sales", "sales.read", "Sales");
  if (!g.ok) return g.block;
  const { facts, snapshot, session, now } = g.data;
  const manage = can(session.ctx, "sales.write");
  const importAvailable = manage && !!createSiteLeadSource(session.ctx.organizationId);
  const pipeline = isAvailable(facts.opportunities) ? summarizePipeline(facts.opportunities.data, now) : null;

  return (
    <OsPage title="Sales" eyebrow="Revenue" summary="Leads, pipeline, proposals and contracts. Weighted value is labelled with its basis; sending a proposal or recording a signature always goes through approval.">
      {pipeline && (
        <Panel id="pipeline" title="Pipeline" subtitle={pipeline.basis}>
          <MetricGrid>
            <Metric label="Open deals" value={pipeline.openCount} hint={`${pipeline.unpricedCount} unpriced (excluded from value)`} />
            <Metric label="Priced value" value={formatMoney(pipeline.totalOpenValue)} />
            <Metric label="Weighted value" value={formatMoney(pipeline.weightedValue)} hint={`${pipeline.weightedByExplicitProbability} explicit · ${pipeline.weightedByStageDefault} stage default`} />
            <Metric label="Stalled / overdue" value={`${pipeline.stalled.length} / ${pipeline.overdueClose.length}`} tone={pipeline.stalled.length + pipeline.overdueClose.length > 0 ? "warn" : undefined} />
          </MetricGrid>
          <div className="mt-3">
            <Table caption="Pipeline by stage" rows={pipeline.byStage} columns={[{ header: "Stage", cell: (r) => titleCase(r.stage) }, { header: "Deals", cell: (r) => r.count }, { header: "Value", cell: (r) => formatMoney(r.totalValue) }, { header: "Weighted", cell: (r) => formatMoney(r.weightedValue) }]} />
          </div>
        </Panel>
      )}

      <Panel id="leads" title="Leads" subtitle="Qualify, then convert into a company, contact and opportunity">
        <SectionGate section={facts.leads} label="Leads">
          {(leads) => (
            <Table
              caption="Leads"
              rows={leads.filter((l) => l.status !== "converted" && l.status !== "disqualified")}
              empty={<Empty title="No active leads" hint="Website form leads can be imported if the import is configured; otherwise add one below." />}
              columns={[
                { header: "Lead", cell: (l) => <>{l.name}{l.company ? <span className="text-gray-500"> · {l.company}</span> : null}</> },
                { header: "Status", cell: (l) => <Badge tone={l.status === "qualified" ? "good" : "neutral"}>{titleCase(l.status)}</Badge> },
                { header: "Source", cell: (l) => l.source ?? "—" },
                { header: "Received", cell: (l) => formatDate(l.createdAt) },
                {
                  header: "Actions",
                  cell: (l) =>
                    manage ? (
                      <div className="flex flex-wrap gap-2">
                        {l.status === "new" && <QuickAction actionKey="lead.qualify" input={{ leadId: l.id, status: "contacted" }} label="Mark contacted" />}
                        {(l.status === "new" || l.status === "contacted") && <QuickAction actionKey="lead.qualify" input={{ leadId: l.id, status: "qualified" }} label="Qualify" tone="primary" />}
                        {l.status === "qualified" && <QuickAction actionKey="lead.convert" input={{ leadId: l.id }} label="Convert" tone="primary" />}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">read-only</span>
                    ),
                },
              ]}
            />
          )}
        </SectionGate>
        {manage && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ActionForm actionKey="lead.create" title="Add a lead" submitLabel="Add lead" fields={[{ name: "name", label: "Name", required: true }, { name: "email", label: "Email" }, { name: "phone", label: "Phone" }, { name: "companyName", label: "Company" }, { name: "problem", label: "Problem / need", kind: "textarea" }, { name: "budget", label: "Budget" }, { name: "timeline", label: "Timeline" }]} />
            {importAvailable ? (
              <ActionForm actionKey="lead.import_site" title="Import website leads" submitLabel="Import new website leads" fields={[{ name: "limit", label: "How many recent leads", kind: "number", defaultValue: "50" }]} />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white/40 p-4 text-xs text-gray-600">
                <p className="font-semibold text-gray-800">Website lead import: not configured</p>
                <p className="mt-1">It needs a server-side read credential and COMPANY_OS_SITE_LEADS_ORG_ID for this organisation. Until then it stays off and nothing is read.</p>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel id="opportunities" title="Opportunities">
        <SectionGate section={facts.opportunities} label="Opportunities">
          {(opps) => (
            <Table
              caption="Opportunities"
              rows={opps.filter((o) => o.stage !== "lost")}
              empty={<Empty title="No opportunities yet" />}
              columns={[
                { header: "Opportunity", cell: (o) => <>{o.title}{o.companyName ? <span className="text-gray-500"> · {o.companyName}</span> : null}</> },
                { header: "Stage", cell: (o) => <Badge tone={o.stage === "won" ? "good" : "info"}>{titleCase(o.stage)}</Badge> },
                { header: "Value", cell: (o) => (o.amount === null ? <Badge>unpriced</Badge> : formatMoney(o.amount)) },
                { header: "Probability", cell: (o) => (o.probability === null ? "stage default" : `${o.probability}%`) },
                { header: "Close", cell: (o) => formatDate(o.expectedCloseDate) },
                {
                  header: "Advance",
                  cell: (o) =>
                    manage ? (
                      <div className="flex flex-wrap gap-2">
                        {FORWARD.filter((to) => canTransition(OPPORTUNITY_MACHINE, o.stage, to).ok).map((to) => (
                          <QuickAction key={to} actionKey="opportunity.advance" input={{ opportunityId: o.id, toStage: to }} label={titleCase(to)} />
                        ))}
                      </div>
                    ) : null,
                },
              ]}
            />
          )}
        </SectionGate>
        {manage && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ActionForm actionKey="opportunity.create" title="New opportunity" submitLabel="Create opportunity" fields={[{ name: "title", label: "Title", required: true }, { name: "companyId", label: "Company", kind: "select", options: companyOptions(facts) }, { name: "kind", label: "Kind", kind: "select", options: [{ value: "new", label: "New" }, { value: "renewal", label: "Renewal" }, { value: "upsell", label: "Upsell" }] }, { name: "amount", label: "Expected value (₹)", kind: "number" }, { name: "probability", label: "Probability % (optional)", kind: "number", help: "Leave blank to use the labelled stage default." }, { name: "expectedCloseDate", label: "Expected close", kind: "date" }]} />
            <ActionForm actionKey="opportunity.advance" title="Mark an opportunity lost" submitLabel="Mark lost" fixed={{ toStage: "lost" }} fields={[{ name: "opportunityId", label: "Opportunity", kind: "select", required: true, options: opportunityOptions(facts) }, { name: "lostReason", label: "Reason", required: true }]} />
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="proposals" title="Proposals" subtitle="Sending to a client is HIGH risk and needs an approver">
          <SectionGate section={facts.proposals} label="Proposals">
            {(rows) => (
              <Table
                caption="Proposals"
                rows={rows}
                empty={<Empty title="No proposals" />}
                columns={[
                  { header: "Proposal", cell: (p) => p.title },
                  { header: "Status", cell: (p) => <Badge tone={p.status === "accepted" ? "good" : "neutral"}>{titleCase(p.status)}</Badge> },
                  { header: "Amount", cell: (p) => (p.amount === null ? "—" : formatMoney(p.amount)) },
                  { header: "Valid until", cell: (p) => formatDate(p.validUntil) },
                  { header: "", cell: (p) => (manage && p.status === "draft" ? <QuickAction actionKey="proposal.send" input={{ proposalId: p.id }} label="Send (needs approval)" /> : null) },
                ]}
              />
            )}
          </SectionGate>
          {manage && <div className="mt-3"><ActionForm actionKey="proposal.create" title="Draft a proposal" submitLabel="Create draft" fields={[{ name: "title", label: "Title", required: true }, { name: "opportunityId", label: "Opportunity", kind: "select", options: opportunityOptions(facts) }, { name: "companyId", label: "Company", kind: "select", options: companyOptions(facts) }, { name: "amount", label: "Amount (₹)", kind: "number" }, { name: "validUntil", label: "Valid until", kind: "date" }]} /></div>}
        </Panel>

        <Panel id="contracts" title="Contracts" subtitle="Recording a signature is CRITICAL: an admin or founder must approve it">
          <SectionGate section={facts.contracts} label="Contracts">
            {(rows) => (
              <Table
                caption="Contracts"
                rows={rows}
                empty={<Empty title="No contracts" />}
                columns={[
                  { header: "Contract", cell: (c) => c.title },
                  { header: "Status", cell: (c) => <Badge tone={c.status === "signed" ? "good" : "neutral"}>{titleCase(c.status)}</Badge> },
                  { header: "Value", cell: (c) => (c.value === null ? "—" : formatMoney(c.value)) },
                  { header: "Ends", cell: (c) => formatDate(c.endDate) },
                  { header: "", cell: (c) => (manage && c.status === "draft" && c.companyId ? <QuickAction actionKey="contract.send" input={{ contractId: c.id }} label="Mark sent" /> : null) },
                ]}
              />
            )}
          </SectionGate>
          {manage && (
            <div className="mt-3 grid gap-3">
              <ActionForm actionKey="contract.create" title="Draft a contract" submitLabel="Create draft" fields={[{ name: "title", label: "Title", required: true }, { name: "companyId", label: "Company", kind: "select", options: companyOptions(facts) }, { name: "value", label: "Value (₹)", kind: "number" }, { name: "startDate", label: "Start", kind: "date" }, { name: "endDate", label: "End", kind: "date" }]} />
              {isAvailable(facts.contracts) && facts.contracts.data.some((c) => c.status === "sent") && (
                <ActionForm actionKey="contract.sign" title="Record a signature (sent contracts)" submitLabel="Request approval to record signature" fields={[{ name: "contractId", label: "Contract", kind: "select", required: true, options: facts.contracts.data.filter((c) => c.status === "sent").map((c) => ({ value: c.id, label: c.title })) }, { name: "signedByName", label: "Signed by", required: true }]} />
              )}
            </div>
          )}
        </Panel>
      </div>
      <p className="sr-only">{snapshot.asOf}</p>
    </OsPage>
  );
}
