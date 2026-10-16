import { can, isAvailable } from "@rinads/company-os";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { Badge, LinkButton, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { titleCase } from "@/lib/company-os/format";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const g = await guard("/os/people", "people.read", "People");
  if (!g.ok) return g.block;
  const { facts, snapshot, session } = g.data;
  const manage = can(session.ctx, "people.manage");

  return (
    <OsPage
      title="People"
      eyebrow="Team"
      summary="Skills, weekly capacity and current load. This informs work recommendations only — managers decide, and nothing here is an employment decision."
      actions={<LinkButton href="/os/work">Allocate work</LinkButton>}
    >
      <Panel id="capacity" title="Capacity">
        <SectionGate section={snapshot.capacity} label="Capacity">
          {(c) => (
            <MetricGrid>
              <Metric label="Active people" value={c.people.length} />
              <Metric label="Over capacity" value={c.overCapacity} tone={c.overCapacity > 0 ? "warn" : undefined} hint="Committed hours above weekly capacity" />
              <Metric label="No capacity recorded" value={c.capacityNotRecorded} hint="Excluded from utilisation, never assumed" />
            </MetricGrid>
          )}
        </SectionGate>
      </Panel>

      <Panel id="team" title="Team">
        <SectionGate section={facts.people} label="People">
          {(people) => (
            <Table
              caption="Team"
              rows={people}
              empty={<p className="text-sm text-gray-600">No profiles yet. Add one below to enable capacity-aware recommendations.</p>}
              columns={[
                { header: "Name", cell: (p) => <>{p.name}{p.roleTitle ? <span className="text-gray-500"> · {p.roleTitle}</span> : null}</> },
                { header: "Status", cell: (p) => <Badge tone={p.status === "active" ? "good" : "neutral"}>{titleCase(p.status)}</Badge> },
                { header: "Skills", cell: (p) => (Object.keys(p.skills).length ? Object.entries(p.skills).map(([k, v]) => `${titleCase(k)} ${v}/5`).join(", ") : "None recorded") },
                { header: "Certified", cell: (p) => p.certifiedSkills?.map(titleCase).join(", ") || "—" },
                { header: "Load", cell: (p) => (p.weeklyCapacityHours ? `${p.committedHours}h / ${p.weeklyCapacityHours}h · ${p.openTaskCount} open` : `${p.committedHours}h committed · capacity not recorded`) },
              ]}
            />
          )}
        </SectionGate>
        {manage && (
          <div className="mt-4">
            <ActionForm
              actionKey="people.update_profile"
              title="Add or update a team profile"
              submitLabel="Save profile"
              fields={[
                { name: "displayName", label: "Name", required: true },
                { name: "userId", label: "Member user id (optional)", help: "Link to an organisation member; leave blank for a contractor without an account." },
                { name: "roleTitle", label: "Role title" },
                { name: "weeklyCapacityHours", label: "Weekly capacity (hours)", kind: "number" },
                { name: "skills", label: "Skills (name:level 1-5, comma separated)", kind: "skills", placeholder: "video_editing:4, copywriting:3" },
                { name: "status", label: "Status", kind: "select", options: [{ value: "active", label: "Active" }, { value: "on_leave", label: "On leave" }, { value: "inactive", label: "Inactive" }] },
              ]}
            />
          </div>
        )}
        {!isAvailable(facts.people) ? null : <p className="mt-3 text-xs text-gray-500">Delivery history is not used for recommendations until a verified source exists.</p>}
      </Panel>
    </OsPage>
  );
}
