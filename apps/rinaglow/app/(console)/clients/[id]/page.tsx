import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { AddCustomerNoteForm } from "./AddCustomerNoteForm";

export const metadata = { title: "Client — R GLOW Console" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.getCustomerProfile(tenancy.organizationId, id);

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <Link href="/clients" className="text-sm text-rinads-primary underline">
          ← Back to clients
        </Link>
        <Card>
          <p className="text-sm text-danger">Could not load this client: {result.error.message}</p>
        </Card>
      </div>
    );
  }

  const { customer, spend, history, notes } = result.data;

  return (
    <div className="space-y-6">
      <Link href="/clients" className="text-sm text-rinads-primary underline">
        ← Back to clients
      </Link>

      <div>
        <h2 className="text-2xl font-semibold text-foreground">{customer.name ?? customer.phone}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {customer.phone}
          {customer.email ? ` · ${customer.email}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className="bg-surface-muted text-foreground">Prefers {customer.preferredChannel}</Badge>
          {customer.optedOutAt ? <Badge className="bg-gray-200 text-gray-600">Opted out of comms</Badge> : null}
          {customer.marketingConsent ? <Badge className="bg-emerald-100 text-emerald-800">Marketing OK</Badge> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifetime spend</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {spend.currency} {spend.totalSpend.toLocaleString("en-IN")}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visits</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{spend.visitCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last visit</p>
          <p className="mt-1 text-sm font-medium text-foreground">{spend.lastVisitAt ? formatDateTime(spend.lastVisitAt) : "—"}</p>
        </Card>
      </div>

      <Card>
        <p className="section-title">Visit history</p>
        {history.length === 0 ? (
          <EmptyState title="No visits yet" description="Appointments will appear here once booked." />
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((appt) => (
              <li key={appt.id} className="flex items-center justify-between gap-3 rounded-lg border border-rinads-primary/10 p-2.5 text-sm">
                <span>{formatDateTime(appt.startsAt)}</span>
                <Badge className="bg-surface-muted text-foreground">{appt.status.replace("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="section-title">Notes</p>
        <AddCustomerNoteForm customerId={customer.id} />
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-rinads-primary/10 p-2.5 text-sm">
                <p className="text-foreground">{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{note.createdAt ? formatDateTime(note.createdAt) : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
