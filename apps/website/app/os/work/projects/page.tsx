import Link from "next/link";
import { can, isAvailable } from "@rinads/company-os";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, Empty, LinkButton, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, titleCase } from "@/lib/company-os/format";
import { companyOptions, projectOptions } from "@/lib/company-os/options";
import { getWorkProjectsDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";

export default async function WorkProjectsPage() {
  const g = await guard("/os/work/projects", null, "Projects");
  if (!g.ok) return g.block;
  const { facts, session, now } = g.data;
  const readable = isAvailable(facts.projects);
  const manage = can(session.ctx, "projects.manage");
  const companies = new Map(isAvailable(facts.companies) ? facts.companies.data.map((c) => [c.id, c.name]) : []);
  const signed = isAvailable(facts.contracts) ? facts.contracts.data.filter((c) => c.status === "signed").map((c) => ({ value: c.id, label: c.title })) : [];

  return (
    <OsPage title="Projects" eyebrow="Delivery" summary="Projects and retainers created from signed contracts, with milestones and deliverables. Delayed milestones surface in the Founder attention queue." actions={<LinkButton href="/os/work">Back to Work</LinkButton>}>
      <Panel id="projects" title="Projects & retainers">
        <SectionGate section={facts.projects} label="Projects">
          {(projects) => (
            <Table
              caption="Projects"
              rows={projects}
              empty={<Empty title="No projects yet" hint="A project or retainer is created from a signed contract." />}
              columns={[
                { header: "Project", cell: (p) => p.name },
                { header: "Client", cell: (p) => (p.companyId ? <Link className="hover:underline" href={`/os/customers/${p.companyId}`}>{companies.get(p.companyId) ?? "Client"}</Link> : "—") },
                { header: "Kind", cell: (p) => titleCase(p.kind) },
                { header: "Status", cell: (p) => <Badge tone={p.status === "active" ? "good" : p.status === "on_hold" ? "warn" : "neutral"}>{titleCase(p.status)}</Badge> },
                { header: "Due", cell: (p) => <span className={p.dueDate && new Date(p.dueDate) < now && (p.status === "active" || p.status === "on_hold") ? "font-semibold text-red-700" : ""}>{formatDate(p.dueDate)}</span> },
              ]}
            />
          )}
        </SectionGate>
        {readable && manage && (
          <div className="mt-4">
            <ActionForm actionKey="project.create" title="Create a project or retainer" submitLabel="Create project" fields={[{ name: "name", label: "Name", required: true }, { name: "companyId", label: "Client", kind: "select", options: companyOptions(facts) }, { name: "contractId", label: "Signed contract", kind: "select", options: signed, help: "Only signed contracts can be linked." }, { name: "kind", label: "Kind", kind: "select", options: [{ value: "project", label: "Project" }, { value: "retainer", label: "Retainer" }] }, { name: "status", label: "Status", kind: "select", options: [{ value: "planned", label: "Planned" }, { value: "active", label: "Active" }] }, { name: "dueDate", label: "Due", kind: "date" }, { name: "budget", label: "Budget (₹)", kind: "number" }]} />
          </div>
        )}
      </Panel>

      <Panel id="milestones" title="Milestones">
        <SectionGate section={facts.milestones} label="Milestones">
          {(rows) => (
            <Table
              caption="Milestones"
              rows={isAvailable(facts.projects) ? rows : []}
              empty={<Empty title="No milestones yet" />}
              columns={[
                { header: "Milestone", cell: (m) => m.name },
                { header: "Project", cell: (m) => (isAvailable(facts.projects) ? (facts.projects.data.find((p) => p.id === m.projectId)?.name ?? "—") : "—") },
                { header: "Status", cell: (m) => titleCase(m.status) },
                { header: "Due", cell: (m) => <span className={m.dueDate && m.status !== "done" && new Date(m.dueDate) < now ? "font-semibold text-red-700" : ""}>{formatDate(m.dueDate)}</span> },
                { header: "", cell: (m) => (manage && m.status !== "done" ? <QuickAction actionKey="milestone.update" input={{ projectId: m.projectId, milestoneId: m.id, name: m.name, status: "done" }} label="Mark done" /> : null) },
              ]}
            />
          )}
        </SectionGate>
        {readable && manage && (
          <div className="mt-4">
            <ActionForm actionKey="milestone.update" title="Add a milestone" submitLabel="Add milestone" fields={[{ name: "projectId", label: "Project", kind: "select", required: true, options: projectOptions(facts) }, { name: "name", label: "Name", required: true }, { name: "dueDate", label: "Due", kind: "date" }]} />
          </div>
        )}
      </Panel>

      <Panel id="deliverables" title="Deliverables & approvals">
        <SectionGate section={facts.deliverables} label="Deliverables">
          {(rows) => (
            <Table
              caption="Deliverables"
              rows={rows}
              empty={<Empty title="No deliverables yet" />}
              columns={[
                { header: "Deliverable", cell: (d) => d.title },
                { header: "Status", cell: (d) => <Badge tone={d.status === "approved" || d.status === "delivered" ? "good" : d.changeRequests >= 2 ? "bad" : "neutral"}>{titleCase(d.status)}</Badge> },
                { header: "Change requests", cell: (d) => d.changeRequests },
                { header: "Due", cell: (d) => formatDate(d.dueDate) },
                {
                  header: "Actions",
                  cell: (d) => (
                    <div className="flex flex-wrap gap-2">
                      {can(session.ctx, "tasks.manage") && (d.status === "draft" || d.status === "changes_requested") && <QuickAction actionKey="deliverable.submit" input={{ deliverableId: d.id }} label="Submit" />}
                      {manage && (d.status === "submitted" || d.status === "in_review") && (
                        <>
                          <QuickAction actionKey="deliverable.review" input={{ deliverableId: d.id, decision: "approve" }} label="Approve" tone="primary" />
                          <QuickAction actionKey="deliverable.review" input={{ deliverableId: d.id, decision: "request_changes", note: "Changes requested — see project notes" }} label="Request changes" />
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </SectionGate>
        {readable && manage && (
          <div className="mt-4">
            <ActionForm actionKey="deliverable.create" title="Add a deliverable" submitLabel="Add deliverable" fields={[{ name: "title", label: "Title", required: true }, { name: "projectId", label: "Project", kind: "select", options: projectOptions(facts) }, { name: "dueDate", label: "Due", kind: "date" }]} />
          </div>
        )}
      </Panel>

      <OsModuleBridge config={getWorkProjectsDestinations()} />
    </OsPage>
  );
}
