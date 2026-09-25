import Link from "next/link";
import { Badge, Card, EmptyState } from "@rinads/ui";
import {
  commerce,
  DEMO_CUSTOMER_ID,
  formatInr,
  orderStatusTone,
  portalContext,
} from "@/lib/commerce";

export default function OrdersPage() {
  const ctx = portalContext();
  const orders = commerce.order.listForCustomer(ctx, DEMO_CUSTOMER_ID);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All orders linked to your Ambady account.
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Your order history will show up here after checkout."
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-semibold text-foreground hover:text-rinads-primary"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}{" "}
                    · {order.lines.length} item{order.lines.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={orderStatusTone(order.status)}>{order.status}</Badge>
                  <span className="font-medium text-foreground">{formatInr(order.grandTotal)}</span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
