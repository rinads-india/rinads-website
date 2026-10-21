import { can, isAvailable } from "@rinads/company-os-engine";
import { loadAcademyDetail } from "@rinads/company-os-server";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, titleCase } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";
import { personOptions } from "@/lib/company-os/options";
import { s, sn } from "@/lib/company-os/rows";

export const dynamic = "force-dynamic";
const STAGES = ["learn", "practice", "lab", "supervised_work", "evidence", "assessment", "certified"];

export default async function AcademyPage() {
  const g = await guard("/os/academy", "academy.read", "Academy");
  if (!g.ok) return g.block;
  const { facts, session } = g.data;
  const manage = can(session.ctx, "academy.manage");
  const detail = await loadAcademyDetail(session.db, session.ctx);
  const names = memberNames(facts);
  const skillName = new Map(isAvailable(detail.skills) ? detail.skills.data.map((r) => [s(r, "id"), s(r, "name") || s(r, "skill_key")]) : []);

  return (
    <OsPage title="Academy" eyebrow="Skills" summary="Skill → learn → practice → lab → supervised work → evidence → assessment → certification. Progress and certification are advisory inputs to work recommendations; they never make an employment decision.">
      <Panel id="skills" title="Skill graph">
        <SectionGate section={detail.skills} label="Skills">
          {(rows) => <Table caption="Skills" rows={rows} empty={<Empty title="No skills defined" />} columns={[{ header: "Skill", cell: (r) => s(r, "name") || s(r, "skill_key") }, { header: "Key", cell: (r) => s(r, "skill_key") }, { header: "Description", cell: (r) => sn(r, "description") ?? "—" }]} />}
        </SectionGate>
        {manage && <div className="mt-4"><ActionForm actionKey="academy.skill_create" title="Add a skill" submitLabel="Add skill" fields={[{ name: "skillKey", label: "Key (lowercase_with_underscores)", required: true }, { name: "name", label: "Name", required: true }, { name: "description", label: "Description" }]} /></div>}
      </Panel>
      <Panel id="progress" title="Progress and evidence">
        <SectionGate section={detail.progress} label="Progress">
          {(rows) => (
            <Table
              caption="Learner progress"
              rows={rows}
              empty={<Empty title="No progress recorded" />}
              columns={[
                { header: "Learner", cell: (r) => nameOf(names, sn(r, "user_id")) },
                { header: "Skill", cell: (r) => skillName.get(s(r, "skill_id")) ?? "—" },
                { header: "Stage", cell: (r) => <Badge tone={s(r, "stage") === "certified" ? "good" : "info"}>{titleCase(s(r, "stage"))}</Badge> },
                { header: "Evidence items", cell: (r) => (Array.isArray(r.evidence) ? r.evidence.length : 0) },
                { header: "Certified", cell: (r) => formatDate(sn(r, "certified_at")) },
              ]}
            />
          )}
        </SectionGate>
        {manage && isAvailable(detail.skills) && (
          <div className="mt-4">
            <ActionForm
              actionKey="academy.record_progress"
              title="Record progress"
              submitLabel="Record"
              fields={[
                { name: "userId", label: "Learner", kind: "select", required: true, options: personOptions(facts) },
                { name: "skillId", label: "Skill", kind: "select", required: true, options: detail.skills.data.map((r) => ({ value: s(r, "id"), label: s(r, "name") || s(r, "skill_key") })) },
                { name: "stage", label: "Stage", kind: "select", required: true, options: STAGES.map((x) => ({ value: x, label: titleCase(x) })) },
                { name: "evidenceNote", label: "Evidence note", help: "Certification requires recorded evidence." },
              ]}
            />
          </div>
        )}
      </Panel>
    </OsPage>
  );
}
