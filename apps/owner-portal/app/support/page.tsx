import { Badge, Card, EmptyState } from "@rinads/ui";
import { demoContext, listOrgTickets } from "@/lib/commerce";

function ticketTone(status: string): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "open":
    case "assigned":
    case "in_progress":
      return "warning";
    case "resolved":
    case "closed":
      return "success";
    default:
      return "default";
  }
}

export default function SupportPage() {
  const ctx = demoContext();
  const tickets = listOrgTickets(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Support queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization-wide ticket queue for owner and staff review.
        </p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No support tickets"
          description="Tickets created in the customer portal or storefront will appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Customer</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ticket.messages[0]?.body}</p>
                  </td>
                  <td>
                    <Badge tone={ticketTone(ticket.status)}>{ticket.status}</Badge>
                  </td>
                  <td>{ticket.priority}</td>
                  <td>{ticket.category}</td>
                  <td className="text-muted-foreground">{ticket.customerId}</td>
                  <td className="text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="rbac-note">
        Staff roles (<code className="text-xs">staff</code>, <code className="text-xs">manager</code>) will see
        scoped ticket views in Phase 1+. Owner/founder sees the full org queue.
      </p>
    </div>
  );
}
