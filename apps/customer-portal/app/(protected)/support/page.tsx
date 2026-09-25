import { Badge, Card, EmptyState } from "@rinads/ui";
import { SupportTicketForm } from "@/components/SupportTicketForm";
import {
  commerce,
  DEMO_CUSTOMER_ID,
  portalContext,
  ticketStatusTone,
} from "@/lib/commerce";

export default function SupportPage() {
  const ctx = portalContext();
  const tickets = commerce.support.listForCustomer(ctx, DEMO_CUSTOMER_ID);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View open tickets or start a new conversation with our team.
        </p>
      </header>

      <section aria-labelledby="tickets-heading">
        <h2 id="tickets-heading" className="mb-3 text-lg font-semibold">
          Your tickets
        </h2>
        {tickets.length === 0 ? (
          <EmptyState
            title="No support tickets"
            description="Create a ticket below if you need help with an order."
          />
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Card className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{ticket.subject}</p>
                    <Badge tone={ticketStatusTone(ticket.status)}>{ticket.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ticket.category} ·{" "}
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.messages[0]?.body}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="create-ticket-heading">
        <h2 id="create-ticket-heading" className="mb-3 text-lg font-semibold">
          Create ticket
        </h2>
        <Card>
          <SupportTicketForm />
        </Card>
      </section>
    </div>
  );
}
