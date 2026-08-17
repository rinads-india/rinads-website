import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RuntimeExecutionPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = opsContext();
  const execution = operations.runtime.getExecution(id);

  if (!execution || execution.organizationId !== ctx.organizationId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/runtime" className="text-sm text-rinads-primary hover:underline">
          ← Runtime dashboard
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{execution.workflowKey}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Execution {execution.id}</p>
      </div>

      <Card>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge tone={execution.status === "completed" ? "success" : execution.status === "failed" ? "danger" : "warning"}>
                {execution.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Correlation</dt>
            <dd className="font-mono text-xs">{execution.correlationId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Causation</dt>
            <dd className="font-mono text-xs">{execution.causationId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{new Date(execution.updatedAt).toLocaleString("en-IN")}</dd>
          </div>
        </dl>
        {execution.errorMessage ? (
          <p className="mt-4 text-sm text-destructive">{execution.errorMessage}</p>
        ) : null}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Step graph</h3>
        </div>
        <ul className="divide-y divide-border">
          {execution.stepRuns.map((step) => (
            <li key={step.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{step.stepKey}</p>
                <p className="text-muted-foreground">{step.actionKey}</p>
              </div>
              <Badge tone={step.status === "completed" ? "success" : step.status === "failed" ? "danger" : "warning"}>
                {step.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
