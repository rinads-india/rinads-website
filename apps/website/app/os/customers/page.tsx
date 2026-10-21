import Link from "next/link";
import { isAvailable, summarizeReceivables } from "@rinads/company-os-engine";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { Badge, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatMoney, titleCase } from "@/lib/company-os/format";
import { getCustomersModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  // Customers stays reachable for every member (legacy bridge below); the CRM workspace needs clients.read.
  const g = await guard("/os/customers", null, "Customers", { business: <OsModuleBridge config={getCustomersModuleDestinations()} /> });
  if (!g.ok) return g.block;
  const { facts, now, session } = g.data;
  const canRead = session.ctx.permissions.includes("clients.read") || session.ctx.roleKey === "founder" || session.ctx.roleKey === "super_admin";
  const canManage = session.ctx.permissions.includes("clients.write") || session.ctx.roleKey === "founder" || session.ctx.roleKey === "super_admin";

  const recv = isAvailable(facts.invoices) && isAvailable(facts.payments) ? summarizeReceivables(facts.invoices.data, facts.payments.data, now) : null;

  return (
    <OsPage title="Customers" eyebrow="Revenue" summary="Companies, contacts and client workspaces — one connected record from lead to renewal.">
      {canRead ? (
        <>
          <Panel id="companies" title="Companies" subtitle="A company becomes a client once a contract is signed">
            <SectionGate section={facts.companies} label="Companies">
              {(companies) => {
                const oppByCompany = new Map<string, number>();
                if (isAvailable(facts.opportunities)) for (const o of facts.opportunities.data) if (o.companyId && o.stage !== "won" && o.stage !== "lost") oppByCompany.set(o.companyId, (oppByCompany.get(o.companyId) ?? 0) + 1);
                const projByCompany = new Map<string, number>();
                if (isAvailable(facts.projects)) for (const p of facts.projects.data) if (p.companyId && p.status === "active") projByCompany.set(p.companyId, (projByCompany.get(p.companyId) ?? 0) + 1);
                const owed = new Map<string, number>();
                for (const r of recv?.rows ?? []) if (r.invoice.companyId) owed.set(r.invoice.companyId, (owed.get(r.invoice.companyId) ?? 0) + r.outstanding);
                return (
                  <>
                    <MetricGrid>
                      <Metric label="Clients" value={companies.filter((c) => c.relationship === "client").length} />
                      <Metric label="Prospects" value={companies.filter((c) => c.relationship === "prospect").length} />
                      <Metric label="Active projects" value={[...projByCompany.values()].reduce((a, b) => a + b, 0)} />
                      <Metric label="Open deals" value={[...oppByCompany.values()].reduce((a, b) => a + b, 0)} />
                    </MetricGrid>
                    <div className="mt-4">
                      <Table
                        caption="Companies"
                        rows={companies}
                        empty={<p className="text-sm text-gray-600">No companies yet. Convert a qualified lead in Sales, or add one below.</p>}
                        columns={[
                          { header: "Company", cell: (c) => <Link className="font-semibold hover:underline" href={`/os/customers/${c.id}`}>{c.name}</Link> },
                          { header: "Relationship", cell: (c) => <Badge tone={c.relationship === "client" ? "good" : c.relationship === "churned" ? "bad" : "neutral"}>{titleCase(c.relationship)}</Badge> },
                          { header: "Priority", cell: (c) => titleCase(c.priority) },
                          { header: "Open deals", cell: (c) => oppByCompany.get(c.id) ?? 0 },
                          { header: "Active projects", cell: (c) => projByCompany.get(c.id) ?? 0 },
                          ...(recv ? [{ header: "Outstanding", cell: (c: { id: string }) => (owed.get(c.id) ? formatMoney(owed.get(c.id)!) : "—") }] : []),
                        ]}
                      />
                    </div>
                  </>
                );
              }}
            </SectionGate>
          </Panel>
          {canManage && (
            <Panel id="new-company" title="Add a company">
              <ActionForm
                actionKey="company.create"
                submitLabel="Add company"
                fields={[
                  { name: "name", label: "Company name", required: true },
                  { name: "relationship", label: "Relationship", kind: "select", options: [{ value: "prospect", label: "Prospect" }, { value: "client", label: "Client" }, { value: "partner", label: "Partner" }] },
                  { name: "priority", label: "Client priority", kind: "select", options: [{ value: "strategic", label: "Strategic" }, { value: "standard", label: "Standard" }, { value: "low", label: "Low" }], help: "Used by explainable work allocation." },
                  { name: "industry", label: "Industry" },
                  { name: "website", label: "Website" },
                ]}
              />
            </Panel>
          )}
        </>
      ) : (
        <Panel title="CRM workspace"><p className="text-sm text-gray-700">Your role does not include <code>clients.read</code>, so company records are not shown. The tools below remain available.</p></Panel>
      )}
      <OsModuleBridge config={getCustomersModuleDestinations()} />
    </OsPage>
  );
}
