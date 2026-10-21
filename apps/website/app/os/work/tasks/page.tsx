import { can, isAvailable } from "@rinads/company-os-engine";
import { guard } from "@/components/os/company/guard";
import { OsPage, Panel, SectionGate, LinkButton } from "@/components/os/company/ui";
import { BusinessTasksBridge } from "@/components/os/company/BusinessTasksBridge";
import { memberNames } from "@/lib/company-os/names";
import { TaskTable } from "../page";

export const dynamic = "force-dynamic";

export default async function WorkTasksPage() {
  const g = await guard("/os/work/tasks", null, "Tasks", { business: <BusinessTasksBridge /> });
  if (!g.ok) return g.block;
  const { facts, session, now } = g.data;
  const names = memberNames(facts);
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  const tasks = isAvailable(facts.tasks) ? [...facts.tasks.data].sort((a, b) => (a.status === "completed" ? 1 : 0) - (b.status === "completed" ? 1 : 0) || rank[a.priority] - rank[b.priority] || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999")) : [];
  return (
    <OsPage title="Tasks" eyebrow="Work" summary="Open tasks plus anything completed in the last two days. Starting or completing a task is checked against its dependencies." actions={<LinkButton href="/os/work">Back to Work</LinkButton>}>
      <Panel title="All tasks">
        <SectionGate section={facts.tasks} label="Tasks">{() => <TaskTable tasks={tasks} names={names} now={now} manage={can(session.ctx, "work.write")} />}</SectionGate>
      </Panel>
    </OsPage>
  );
}
