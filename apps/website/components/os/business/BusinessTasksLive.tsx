import { requirePlanModule } from "@rinads/tenancy";
import { createLiveTaskAction } from "@/app/os/actions/live-business";
import { loadLiveTasks, resolveLiveOsTenant } from "@/lib/os-tenant-live";

function isWritableEntitlement(state?: string) {
  return state === "paid_active" || state === "trialing" || state === "expiring";
}

function priorityClass(priority: string) {
  if (priority === "critical") return "bg-red-100 text-red-800";
  if (priority === "high") return "bg-orange-100 text-orange-800";
  if (priority === "low") return "bg-slate-100 text-slate-700";
  return "bg-blue-100 text-blue-800";
}

export async function BusinessTasksLive() {
  const { supabase, tenancy } = await resolveLiveOsTenant();
  if (!tenancy) {
    return (
      <section className="os-glass rounded-3xl p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-gray-900">Work</h1>
        <p className="mt-2 text-sm text-gray-600">Choose an active RI ID organization to load tenant tasks.</p>
      </section>
    );
  }

  const tasks = await loadLiveTasks(supabase, tenancy.organizationId);
  const moduleAccess = requirePlanModule(tenancy, "tasks");
  const canWrite = moduleAccess.allowed && isWritableEntitlement(tenancy.entitlementState);
  const readOnly = tenancy.entitlementState === "expired_read_only";

  return (
    <section className="space-y-4">
      <div className="os-glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">Live tenant data</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Work</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              First-value task management persisted to <code>cos_tasks</code> under the active organization.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canWrite ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {canWrite ? "Write enabled" : readOnly ? "Read only" : "Upgrade / activate"}
          </span>
        </div>
      </div>

      {tasks.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Task data could not be loaded: {tasks.error}
        </div>
      ) : null}

      {canWrite ? (
        <form action={createLiveTaskAction} className="os-glass grid gap-3 rounded-3xl p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <h2 className="font-semibold text-gray-900">Add first task</h2>
            <p className="mt-1 text-xs text-gray-500">Writes are checked by plan/module policy and Supabase RLS.</p>
          </div>
          <input name="title" required maxLength={240} placeholder="Task title" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm sm:col-span-2" />
          <select name="priority" defaultValue="normal" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm">
            <option value="low">Low priority</option>
            <option value="normal">Normal priority</option>
            <option value="high">High priority</option>
            <option value="critical">Critical priority</option>
          </select>
          <input name="dueDate" type="date" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm" />
          <button type="submit" className="min-h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white sm:col-span-2 sm:justify-self-start">
            Save task
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {readOnly
            ? "The trial has expired. Existing tasks remain readable, while database write policies deny inserts and updates until conversion."
            : moduleAccess.allowed
              ? "Activate a paid plan or governed trial to create tasks."
              : moduleAccess.reason}
        </div>
      )}

      <div className="os-glass overflow-hidden rounded-3xl">
        <div className="border-b border-gray-200/80 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Task records</h2>
          <p className="mt-1 text-xs text-gray-500">{tasks.data.length} persisted task{tasks.data.length === 1 ? "" : "s"}</p>
        </div>
        {tasks.data.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No tasks yet. Create the first tenant-scoped task above.</div>
        ) : (
          <ul className="divide-y divide-gray-200/80">
            {tasks.data.map((task) => (
              <li key={task.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{task.status.replaceAll("_", " ")}{task.dueAt ? ` · due ${new Date(task.dueAt).toLocaleDateString("en-IN")}` : ""}</p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
