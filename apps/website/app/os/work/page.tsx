import Link from "next/link";
import { can, isAvailable, type TaskFact } from "@rinads/company-os";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { ActionForm } from "@/components/os/company/ActionForm";
import { AllocationPanel } from "@/components/os/company/AllocationPanel";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, Empty, LinkButton, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, titleCase } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";
import { personOptions, projectOptions } from "@/lib/company-os/options";
import { getWorkModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";

export function TaskTable({ tasks, names, now, manage }: { tasks: readonly TaskFact[]; names: ReadonlyMap<string, string>; now: Date; manage: boolean }) {
  return (
    <Table
      caption="Tasks"
      rows={tasks}
      empty={<Empty title="No open tasks" hint="Create one below, or tasks arrive from projects and the RINPO runtime." />}
      columns={[
        { header: "Task", cell: (t) => t.title },
        { header: "Status", cell: (t) => <Badge tone={t.status === "blocked" ? "bad" : t.status === "in_progress" ? "info" : "neutral"}>{titleCase(t.status)}</Badge> },
        { header: "Priority", cell: (t) => <Badge tone={t.priority === "urgent" ? "bad" : t.priority === "high" ? "warn" : "neutral"}>{t.priority}</Badge> },
        { header: "Due", cell: (t) => (t.dueAt ? <span className={new Date(t.dueAt) < now ? "font-semibold text-red-700" : ""}>{formatDate(t.dueAt)}</span> : "—") },
        { header: "Owner", cell: (t) => nameOf(names, t.assigneeId) },
        {
          header: "Move",
          cell: (t) =>
            manage ? (
              <div className="flex flex-wrap gap-2">
                {t.status === "todo" && <QuickAction actionKey="task.update_status" input={{ taskId: t.id, status: "in_progress" }} label="Start" />}
                {(t.status === "todo" || t.status === "in_progress") && <QuickAction actionKey="task.update_status" input={{ taskId: t.id, status: "completed" }} label="Complete" tone="primary" />}
                {t.status === "in_progress" && <QuickAction actionKey="task.update_status" input={{ taskId: t.id, status: "blocked" }} label="Block" />}
                {t.status === "blocked" && <QuickAction actionKey="task.update_status" input={{ taskId: t.id, status: "todo" }} label="Unblock" />}
              </div>
            ) : null,
        },
      ]}
    />
  );
}

export default async function WorkPage() {
  const g = await guard("/os/work", null, "Work");
  if (!g.ok) return g.block;
  const { facts, snapshot: s, session, now } = g.data;
  const names = memberNames(facts);
  const manageTasks = can(session.ctx, "tasks.manage");
  const open = isAvailable(facts.tasks) ? facts.tasks.data.filter((t) => t.status === "todo" || t.status === "in_progress" || t.status === "blocked") : [];

  return (
    <OsPage
      title="Work"
      eyebrow="Delivery"
      summary="The existing task engine, now with projects, dependencies and explainable allocation. Managers keep the decision; every override is recorded with its reason."
      actions={
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/os/work/tasks">All tasks</LinkButton>
          <LinkButton href="/os/work/projects">Projects</LinkButton>
          <LinkButton href="/os/people">People</LinkButton>
        </div>
      }
    >
      <SectionGate section={s.work} label="Work">
        {(w) => (
          <MetricGrid>
            <Metric label="Open" value={w.open} />
            <Metric label="Due today" value={w.dueToday} />
            <Metric label="Overdue" value={w.overdue} tone={w.overdue ? "bad" : undefined} />
            <Metric label="Blocked" value={w.blocked} tone={w.blocked ? "warn" : undefined} />
            <Metric label="Urgent" value={w.urgent} />
            <Metric label="Unassigned" value={w.unassigned} tone={w.unassigned ? "warn" : undefined} />
          </MetricGrid>
        )}
      </SectionGate>

      <Panel id="allocation" title="Allocation recommendations" subtitle="Skill, capacity, workload, deadline, client priority, dependencies, role fit — and verified history only when there is enough of it">
        <AllocationPanel facts={facts} ctx={session.ctx} now={now} />
      </Panel>

      <Panel id="board" title="Open work" right={<Link className="text-xs font-semibold underline" href="/os/work/tasks">View all</Link>}>
        <SectionGate section={facts.tasks} label="Tasks">{() => <TaskTable tasks={open.slice(0, 15)} names={names} now={now} manage={manageTasks} />}</SectionGate>
      </Panel>

      {manageTasks && (
        <Panel id="new-task" title="Create a task">
          <ActionForm
            actionKey="task.create"
            submitLabel="Create task"
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "priority", label: "Priority", kind: "select", options: [{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }] },
              { name: "dueAt", label: "Due", kind: "date" },
              { name: "projectId", label: "Project", kind: "select", options: projectOptions(facts) },
              { name: "assigneeId", label: "Assign to", kind: "select", options: personOptions(facts) },
              { name: "estimateHours", label: "Estimate (hours)", kind: "number", help: "Used by allocation; leave blank if unknown." },
              { name: "requiredSkills", label: "Required skills", kind: "csv", placeholder: "design, motion", help: "Comma-separated." },
              { name: "description", label: "Notes", kind: "textarea" },
            ]}
          />
        </Panel>
      )}

      <OsModuleBridge config={getWorkModuleDestinations()} />
    </OsPage>
  );
}
