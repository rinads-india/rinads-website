import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { retryCommunicationFormAction } from "../actions";

export const metadata = { title: "Communication detail — R GLOW Console" };

export default async function CommunicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenancy = await requireTenancy();
  const { communications } = await getSalonDeps();
  const result = await communications.details(tenancy.organizationId, id);
  if (!result.ok) return <Card><p className="text-sm text-danger">{result.error.message}</p></Card>;
  const { communication, timeline } = result.data;
  const canRetry =
    isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.communications.retry");
  const retryable = ["failed", "dead_letter", "not_configured"].includes(communication.status);

  return (
    <div className="space-y-6">
      <Link href="/communications" className="text-sm text-rinads-primary underline">← Back to communications</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{communication.recipient}</h2>
          <p className="text-sm text-muted-foreground">{communication.channel} · {communication.templateKey}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{communication.status.replace("_", " ")}</Badge>
          {canRetry && retryable ? (
            <form action={retryCommunicationFormAction}>
              <input type="hidden" name="outboxId" value={communication.id} />
              <button className="btn-primary text-xs" type="submit">Retry</button>
            </form>
          ) : null}
        </div>
      </div>
      <Card>
        <p className="section-title">Delivery details</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Attempts</dt><dd>{communication.attempts}</dd></div>
          <div><dt className="text-muted-foreground">Provider ID</dt><dd>{communication.providerMessageId ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{new Date(communication.createdAt).toLocaleString()}</dd></div>
          <div><dt className="text-muted-foreground">Next attempt</dt><dd>{communication.nextAttemptAt ? new Date(communication.nextAttemptAt).toLocaleString() : "—"}</dd></div>
        </dl>
        {communication.lastError ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-danger">{communication.lastError}</p> : null}
        <pre className="mt-3 overflow-auto rounded-lg bg-surface-muted p-3 text-xs">{JSON.stringify(communication.payload, null, 2)}</pre>
      </Card>
      <Card>
        <p className="section-title">Append-only delivery timeline</p>
        {timeline.length === 0 ? (
          <EmptyState title="No provider callbacks yet" description="Provider status callbacks will appear here." />
        ) : (
          <ol className="mt-3 space-y-3 border-l border-rinads-primary/20 pl-4">
            {timeline.map((event) => (
              <li key={event.id}>
                <p className="text-sm font-medium text-foreground">{event.providerStatus}</p>
                <p className="text-xs text-muted-foreground">{event.provider} · {new Date(event.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
