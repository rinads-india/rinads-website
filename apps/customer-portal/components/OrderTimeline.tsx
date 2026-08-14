import type { OrderEvent } from "@rinads/commerce";

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  return (
    <ol className="relative space-y-4 border-l border-rinads-primary/20 pl-6">
      {sorted.map((event) => (
        <li key={event.id} className="relative">
          <span
            className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-rinads-primary bg-surface"
            aria-hidden
          />
          <p className="font-medium text-foreground">{event.label}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(event.occurredAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </li>
      ))}
    </ol>
  );
}
