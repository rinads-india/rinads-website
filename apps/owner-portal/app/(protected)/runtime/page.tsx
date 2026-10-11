import Link from "next/link";
import { Badge, Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";
import { replayRuntimeDeadLetterAction } from "./actions";

export default function RuntimeDashboardPage() {
  const ctx = opsContext();
  const dashboard = operations.runtime.getDashboard(ctx.organizationId);
  const executions = operations.runtime.listExecutions(ctx.organizationId).slice(0, 10);
  const deadLetters = operations.runtime.getDeadLetters(ctx.organizationId).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Runtime 2.0</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Durable workflows, jobs, verification, approvals, and recovery for this tenant.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/runtime/events" className="text-rinads-primary hover:underline">
            Event explorer
          </Link>
          <Link href="/approvals" className="text-rinads-primary hover:underline">
            Approvals ({dashboard.approvals})
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-muted-foreground">Queued executions</p>
          <p className="text-2xl font-bold">{dashboard.executions.queued}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Running / waiting</p>
          <p className="text-2xl font-bold">
            {dashboard.executions.running + dashboard.executions.waiting}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold">{dashboard.executions.failed}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Outbox pending</p>
          <p className="text-2xl font-bold">{dashboard.outboxPending}</p>
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">Recent executions</h3>
          </div>
          {executions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No workflow executions yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {executions.map((exec) => (
                <li key={exec.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <Link href={`/runtime/executions/${exec.id}`} className="font-medium text-rinads-primary hover:underline">
                      {exec.workflowKey}
                    </Link>
                    <p className="text-xs text-muted-foreground">{exec.correlationId}</p>
                  </div>
                  <Badge tone={exec.status === "completed" ? "success" : exec.status === "failed" ? "danger" : "warning"}>
                    {exec.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">Dead letters</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Replay resets the original job and preserves its idempotency identity and audit history.
            </p>
          </div>
          {deadLetters.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No dead-letter items.</p>
          ) : (
            <ul className="divide-y divide-border">
              {deadLetters.map((item) => (
                <li key={item.id} className="px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.sourceType}</p>
                        <Badge tone={item.status === "open" ? "danger" : "success"}>{item.status}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{item.errorMessage}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        Source: {item.sourceId} · Replay count: {item.replayCount}
                      </p>
                    </div>
                    {item.sourceType === "job" && item.status === "open" ? (
                      <form action={replayRuntimeDeadLetterAction}>
                        <input type="hidden" name="deadLetterId" value={item.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Replay job
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card>
        <p className="text-sm text-muted-foreground">
          Jobs queued: {dashboard.jobs.queued} · Open dead-letter jobs: {dashboard.jobs.deadLetter}
        </p>
      </Card>
    </div>
  );
}
