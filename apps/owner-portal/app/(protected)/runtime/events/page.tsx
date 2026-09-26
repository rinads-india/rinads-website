import Link from "next/link";
import { Badge, Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function RuntimeEventsPage() {
  const ctx = opsContext();
  const events = operations.runtime.listEvents(ctx.organizationId).slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Event explorer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Canonical business events with sensitive payload fields masked.
          </p>
        </div>
        <Link href="/runtime" className="text-sm text-rinads-primary hover:underline">
          Dashboard
        </Link>
      </div>

      <Card className="p-0 overflow-hidden">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No events recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.eventType}</p>
                  <Badge tone="default">{event.source ?? "system"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {event.aggregateType}/{event.aggregateId} · {event.correlationId ?? "—"}
                </p>
                <pre className="mt-2 max-h-24 overflow-auto rounded bg-surface-muted p-2 text-xs">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
