import Link from "next/link";
import { notFound } from "next/navigation";
import { LIFECYCLE_STAGES, isAvailable, isClient, summarizeReceivables, can } from "@rinads/company-os-engine";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, LinkButton, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, formatMoney, titleCase } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ClientWorkspacePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId: companyId } = await params;
  if (!UUID.test(companyId)) notFound();
  const g = await guard(`/os/customers/${companyId}`, "clients.read", "Client workspace");
  if (!g.ok) return g.block;
  const { facts, session, now } = g.data;
  if (!isAvailable(facts.companies)) return <OsPage title="Client workspace"><Panel title="Unavailable"><p className="text-sm text-gray-600">{facts.companies.reason}</p></Panel></OsPage>;
  const company = facts.companies.data.find((c) => c.id === companyId);
  if (!company) notFound(); // also what another tenant's id looks like: RLS returns nothing

  const names = memberNames(facts);
  const mine = <T extends { companyId: string | null }>(rows: readonly T[]) => rows.filter((r) => r.companyId === companyId);
  const opps = isAvailable(facts.opportunities) ? mine(facts.opportunities.data) : [];
  const proposals = isAvailable(facts.proposals) ? mine(facts.proposals.data) : [];
  const contracts = isAvailable(facts.contracts) ? mine(facts.contracts.data) : [];
  const projects = isAvailable(facts.projects) ? mine(facts.projects.data) : [];
  const projectIds = new Set(projects.map((p) => p.id));
  const deliverables = isAvailable(facts.deliverables) ? facts.deliverables.data.filter((d) => d.companyId === companyId || (d.projectId && projectIds.has(d.projectId))) : [];
  const tasks = isAvailable(facts.tasks) ? facts.tasks.data.filter((t) => t.projectId && projectIds.has(t.projectId)) : [];
  const invoices = isAvailable(facts.invoices) ? mine(facts.invoices.data) : [];
  const recv = isAvailable(facts.invoices) && isAvailable(facts.payments) ? summarizeReceivables(invoices, facts.payments.data, now) : null;

  const contactsRes = await session.db.select("crm_contacts", { where: { organization_id: session.ctx.organizationId, company_id: companyId }, limit: 200 });
  const commRes = can(session.ctx, "comms.read")
    ? await session.db.select("comm_activities", { where: { organization_id: session.ctx.organizationId, linked_type: "company", linked_id: companyId }, order: [{ column: "occurred_at", ascending: false }], limit: 20 })
    : null;

  const signed = contracts.filter((c) => c.status === "signed").length;
  const active = projects.filter((p) => p.status === "active").length;
  const client = isClient({ signedContracts: signed, activeProjects: active });
  const stageDone: Record<string, boolean> = {
    lead: true,
    company_contact: true,
    opportunity: opps.length > 0,
    proposal: proposals.length > 0,
    contract: contracts.length > 0,
    client,
    project: projects.length > 0,
    milestone: isAvailable(facts.milestones) ? facts.milestones.data.some((m) => projectIds.has(m.projectId)) : false,
    task: tasks.length > 0,
    deliverable: deliverables.length > 0,
    approval: deliverables.some((d) => d.status === "approved" || d.status === "delivered"),
    invoice: invoices.length > 0,
    payment: !!recv && invoices.some((i) => i.status === "paid" || i.status === "partially_paid"),
    performance: false,
    renewal: opps.some((o) => o.title.toLowerCase().includes("renew")),
  };

  return (
    <OsPage
      title={company.name}
      eyebrow={`Client workspace · ${titleCase(company.relationship)} · ${titleCase(company.priority)} priority`}
      summary={`Owner: ${nameOf(names, company.ownerId)}. Everything below is linked to this company inside your organisation.`}
      actions={<LinkButton href="/os/customers">All customers</LinkButton>}
    >
      <Panel id="lifecycle" title="Lifecycle" subtitle="Lead → company/contact → opportunity → proposal → contract → client → project → … → renewal. Filled = records exist.">
        <ol className="flex flex-wrap gap-2">
          {LIFECYCLE_STAGES.map((s) => (
            <li key={s.id}>
              <Badge tone={stageDone[s.id] ? "good" : "neutral"}>{s.label}</Badge>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-gray-500">“Performance” fills when published assets report results; it is never inferred.</p>
      </Panel>

      <MetricGrid>
        <Metric label="Open deals" value={opps.filter((o) => o.stage !== "won" && o.stage !== "lost").length} />
        <Metric label="Active projects" value={active} />
        <Metric label="Signed contracts" value={signed} />
        {recv ? <Metric label="Outstanding" value={formatMoney(recv.totalOutstanding)} hint={`${formatMoney(recv.totalOverdue)} overdue`} tone={recv.totalOverdue > 0 ? "bad" : undefined} /> : <Metric label="Outstanding" value="—" hint="Finance not visible to your role" />}
      </MetricGrid>

      <Panel id="contacts" title="Contacts">
        {contactsRes.error ? (
          <p className="text-sm text-gray-600">Contacts could not be read: {contactsRes.error.message}</p>
        ) : (
          <Table
            caption="Contacts"
            rows={contactsRes.data}
            empty={<Empty title="No contacts yet" />}
            columns={[
              { header: "Name", cell: (c) => <>{String(c.full_name)} {c.is_primary ? <Badge tone="info">primary</Badge> : null}</> },
              { header: "Role", cell: (c) => String(c.role_title ?? "—") },
              { header: "Email", cell: (c) => String(c.email ?? "—") },
              { header: "Phone", cell: (c) => String(c.phone ?? "—") },
            ]}
          />
        )}
        {can(session.ctx, "clients.write") && (
          <div className="mt-4">
            <ActionForm actionKey="contact.create" title="Add a contact" submitLabel="Add contact" fixed={{ companyId }} fields={[{ name: "fullName", label: "Full name", required: true }, { name: "email", label: "Email" }, { name: "phone", label: "Phone" }, { name: "roleTitle", label: "Role" }]} />
          </div>
        )}
      </Panel>

      <Panel id="deals" title="Opportunities, proposals & contracts">
        <Table
          caption="Opportunities"
          rows={opps}
          empty={<Empty title="No opportunities" hint="Create one from Sales." action={<LinkButton href="/os/sales">Open Sales</LinkButton>} />}
          columns={[
            { header: "Opportunity", cell: (o) => o.title },
            { header: "Stage", cell: (o) => <Badge tone={o.stage === "won" ? "good" : o.stage === "lost" ? "bad" : "info"}>{titleCase(o.stage)}</Badge> },
            { header: "Value", cell: (o) => (o.amount === null ? "unpriced" : formatMoney(o.amount)) },
            { header: "Expected close", cell: (o) => formatDate(o.expectedCloseDate) },
          ]}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Table caption="Proposals" rows={proposals} empty={<p className="text-xs text-gray-500">No proposals.</p>} columns={[{ header: "Proposal", cell: (p) => p.title }, { header: "Status", cell: (p) => titleCase(p.status) }, { header: "Amount", cell: (p) => (p.amount === null ? "—" : formatMoney(p.amount)) }]} />
          <Table caption="Contracts" rows={contracts} empty={<p className="text-xs text-gray-500">No contracts.</p>} columns={[{ header: "Contract", cell: (c) => c.title }, { header: "Status", cell: (c) => <Badge tone={c.status === "signed" ? "good" : "neutral"}>{titleCase(c.status)}</Badge> }, { header: "Ends", cell: (c) => formatDate(c.endDate) }]} />
        </div>
      </Panel>

      <Panel id="delivery" title="Projects, tasks & deliverables">
        <Table
          caption="Projects"
          rows={projects}
          empty={<Empty title="No projects" hint="A project or retainer is created from a signed contract." />}
          columns={[
            { header: "Project", cell: (p) => p.name },
            { header: "Kind", cell: (p) => titleCase(p.kind) },
            { header: "Status", cell: (p) => titleCase(p.status) },
            { header: "Due", cell: (p) => formatDate(p.dueDate) },
            { header: "Open tasks", cell: (p) => tasks.filter((t) => t.projectId === p.id && t.status !== "completed" && t.status !== "cancelled").length },
          ]}
        />
        <div className="mt-3">
          <Table caption="Deliverables" rows={deliverables} empty={<p className="text-xs text-gray-500">No deliverables.</p>} columns={[{ header: "Deliverable", cell: (d) => d.title }, { header: "Status", cell: (d) => <Badge tone={d.status === "approved" || d.status === "delivered" ? "good" : d.changeRequests >= 2 ? "bad" : "neutral"}>{titleCase(d.status)}</Badge> }, { header: "Change requests", cell: (d) => d.changeRequests }, { header: "Due", cell: (d) => formatDate(d.dueDate) }]} />
        </div>
      </Panel>

      <Panel id="finance" title="Invoices & payments" right={<Link className="text-xs font-semibold underline" href="/os/finance">Finance</Link>}>
        <SectionGate section={facts.invoices} label="Invoices">
          {() => (
            <Table caption="Invoices" rows={invoices} empty={<p className="text-sm text-gray-600">No invoices for this client.</p>} columns={[{ header: "Invoice", cell: (i) => i.number }, { header: "Status", cell: (i) => titleCase(i.status) }, { header: "Due", cell: (i) => formatDate(i.dueDate) }, { header: "Total", cell: (i) => formatMoney(i.total, i.currency) }]} />
          )}
        </SectionGate>
      </Panel>

      {commRes && (
        <Panel id="comms" title="Communications">
          <Table caption="Communications" rows={commRes.data} empty={<p className="text-sm text-gray-600">No logged calls, messages or email.</p>} columns={[{ header: "When", cell: (c) => formatDate(String(c.occurred_at)) }, { header: "Channel", cell: (c) => titleCase(String(c.channel)) }, { header: "Direction", cell: (c) => String(c.direction) }, { header: "Subject", cell: (c) => String(c.subject ?? c.summary ?? "—") }, { header: "Status", cell: (c) => String(c.status) }]} />
        </Panel>
      )}
    </OsPage>
  );
}
