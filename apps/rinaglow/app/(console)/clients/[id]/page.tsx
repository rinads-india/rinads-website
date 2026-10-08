import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { AddCustomerNoteForm } from "./AddCustomerNoteForm";
import { updateCustomerCommunicationPreferencesAction } from "./actions";

export const metadata = { title: "Client — R GLOW Console" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenancy = await requireTenancy();
  const { repo, automations, loyalty } = await getSalonDeps();
  const [result, reviews, recovery, loyaltyAccount, loyaltyBalance] = await Promise.all([
    repo.getCustomerProfile(tenancy.organizationId, id),
    automations.automation.getReviewSummary(tenancy.organizationId, id),
    automations.automation.getRecoverySummary(tenancy.organizationId, id),
    loyalty.getAccount(tenancy.organizationId, id),
    loyalty.getBalance(tenancy.organizationId, id),
  ]);
  const loyaltyLedger = loyaltyAccount.ok ? await loyalty.listLedger(tenancy.organizationId, loyaltyAccount.data.id, 20) : undefined;

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
        <p className="section-title">Communication preferences</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Record marketing consent only when the client has explicitly agreed. Booking and receipt updates are transactional.
        </p>
        <form action={updateCustomerCommunicationPreferencesAction} className="mt-3 flex flex-wrap items-end gap-4">
          <input type="hidden" name="customerId" value={customer.id} />
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Preferred channel</span>
            <select
              name="preferredChannel"
              defaultValue={customer.preferredChannel}
              className="rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="none">None</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="marketingConsent" defaultChecked={customer.marketingConsent} />
            Explicit marketing consent
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="optedOut" defaultChecked={Boolean(customer.optedOutAt)} />
            Opted out
          </label>
          <button type="submit" className="rounded-lg bg-rinads-primary px-4 py-2 text-sm font-semibold text-white">
            Save preferences
          </button>
        </form>
        {customer.marketingConsentAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Consent recorded {formatDateTime(customer.marketingConsentAt)}
            {customer.marketingConsentSource ? ` via ${customer.marketingConsentSource.replaceAll("_", " ")}` : ""}.
          </p>
        ) : null}
      </Card>

      <Card>
        <p className="section-title">Reviews &amp; recovery</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {reviews.ok
            ? `${reviews.data.requested} review request(s) · ${reviews.data.submitted} response(s) · ${reviews.data.lowRating} manager follow-up(s)`
            : "Review status unavailable"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {recovery.ok
            ? `${recovery.data.queued} recovery message(s) queued · ${recovery.data.converted} converted`
            : "Recovery status unavailable"}
        </p>
      </Card>

      <Card>
        <p className="section-title">Loyalty</p>
        <p className="mt-2 text-2xl font-semibold">{loyaltyBalance?.ok ? loyaltyBalance.data : 0} points</p>
        {loyaltyLedger?.ok && loyaltyLedger.data.length ? (
          <ul className="mt-3 space-y-2">
            {loyaltyLedger.data.map((entry) => <li key={entry.id} className="flex justify-between rounded-lg border border-rinads-primary/10 p-2 text-sm">
              <span>{entry.reason ?? entry.entryType.replace("_", " ")}</span>
              <span className={entry.points > 0 ? "text-emerald-700" : "text-danger"}>{entry.points > 0 ? "+" : ""}{entry.points}</span>
            </li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">No loyalty activity yet.</p>}
      </Card>

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
