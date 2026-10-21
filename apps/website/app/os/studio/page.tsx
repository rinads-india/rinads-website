import Link from "next/link";
import { STUDIO_STAGES, STUDIO_STAGE_LABEL, can, isAvailable, type StudioStage } from "@rinads/company-os-engine";
import { loadStudioDetail } from "@rinads/company-os-server";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, Empty, LinkButton, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, relativeDays } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";
import { companyOptions } from "@/lib/company-os/options";
import { s, sn } from "@/lib/company-os/rows";

export const dynamic = "force-dynamic";

/** The one-click forward move for a stage, including the explicit gate flag a human must assert. */
function forward(stage: StudioStage): { to: StudioStage; label: string; input: Record<string, unknown> } | null {
  const i = STUDIO_STAGES.indexOf(stage);
  const to = STUDIO_STAGES[i + 1];
  if (!to) return null;
  if (stage === "brief") return { to, label: "Brief complete → next", input: { briefComplete: true } };
  if (stage === "qa") return { to, label: "QA passed → Approval", input: { qaPassed: true } };
  if (stage === "approval") return { to, label: "Approved → Master", input: { approved: true } };
  return { to, label: `→ ${STUDIO_STAGE_LABEL[to]}`, input: {} };
}

export default async function StudioPage() {
  const g = await guard("/os/studio", "studio.read", "Studio");
  if (!g.ok) return g.block;
  const { facts, session, now } = g.data;
  const manage = can(session.ctx, "studio.manage");
  const detail = await loadStudioDetail(session.db, session.ctx);
  const names = memberNames(facts);

  return (
    <OsPage title="Studio" eyebrow="Production" summary="One shared production line from request to performance. Gates are enforced by the system: no approval without QA, no master without approval, no publish without an approved master." actions={<LinkButton href="/os/assets">Asset library</LinkButton>}>
      <Panel id="pipeline" title="Pipeline" subtitle="Open jobs by stage">
        <SectionGate section={detail.jobs} label="Studio jobs">
          {(jobs) => {
            const open = jobs.filter((j) => s(j, "status") === "open");
            const counts = STUDIO_STAGES.map((st) => [st, open.filter((j) => s(j, "stage") === st).length] as const).filter(([, c]) => c > 0);
            const overdue = open.filter((j) => sn(j, "due_date") && new Date(s(j, "due_date")).getTime() < now.getTime()).length;
            return (
              <>
                <MetricGrid>
                  <Metric label="Open jobs" value={open.length} />
                  <Metric label="Overdue" value={overdue} tone={overdue > 0 ? "warn" : undefined} />
                  <Metric label="In QA / approval" value={open.filter((j) => ["qa", "approval"].includes(s(j, "stage"))).length} />
                  <Metric label="Done" value={jobs.filter((j) => s(j, "status") === "done").length} />
                </MetricGrid>
                {counts.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Jobs per stage">
                    {counts.map(([st, c]) => (
                      <li key={st}><Badge tone="info">{STUDIO_STAGE_LABEL[st]} · {c}</Badge></li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <Table
                    caption="Studio jobs"
                    rows={open}
                    empty={<Empty title="No open Studio jobs" hint="Create a job from a request to start the production line." />}
                    columns={[
                      { header: "Job", cell: (j) => s(j, "title") },
                      { header: "Stage", cell: (j) => <Badge tone="info">{STUDIO_STAGE_LABEL[s(j, "stage") as StudioStage] ?? s(j, "stage")}</Badge> },
                      { header: "Client-facing", cell: (j) => (j.client_facing === false ? "No" : "Yes") },
                      { header: "Owner", cell: (j) => nameOf(names, sn(j, "owner_id")) },
                      { header: "Due", cell: (j) => (sn(j, "due_date") ? `${formatDate(s(j, "due_date"))} (${relativeDays(s(j, "due_date"), now)})` : "—") },
                      {
                        header: "Move",
                        cell: (j) => {
                          const f = forward(s(j, "stage") as StudioStage);
                          return manage && f ? <QuickAction actionKey="studio.job.advance" input={{ jobId: s(j, "id"), toStage: f.to, ...f.input }} label={f.label} /> : null;
                        },
                      },
                    ]}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Completed stages are recorded per job; optional production stages (strategy, storyboard, design, image, video, animation, VFX, audio, edit) can be skipped, gates cannot. If a move is refused, the reason is shown on the button.</p>
              </>
            );
          }}
        </SectionGate>
        {manage && (
          <div className="mt-4">
            <ActionForm
              actionKey="studio.job.create"
              title="New Studio job"
              submitLabel="Create job"
              fields={[
                { name: "title", label: "Request / title", required: true },
                { name: "companyId", label: "Client", kind: "select", options: companyOptions(facts) },
                { name: "dueDate", label: "Due", kind: "date" },
                { name: "clientFacing", label: "Client-facing (publishing needs approval)", kind: "checkbox", defaultValue: "on" },
              ]}
            />
          </div>
        )}
      </Panel>
      {isAvailable(detail.assets) && (
        <p className="text-xs text-gray-500">
          {detail.assets.data.length} assets registered · <Link className="underline" href="/os/assets">review provenance and approvals</Link>
        </p>
      )}
    </OsPage>
  );
}
