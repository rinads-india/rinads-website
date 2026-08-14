import Link from "next/link";
import { Badge, Card, EmptyState } from "@rinads/ui";
import { demoContext, listOrgOrders } from "@/lib/commerce";

export default function OrdersPage() {
  const ctx = demoContext();
  const orders = listOrgOrders(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All organization orders — owner context has no customerId restriction.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders appear here after checkout completes in the storefront."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/orders/${order.id}`} className="font-medium text-rinads-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{order.customerId ?? order.guestEmail ?? "Guest"}</td>
                  <td>
                    <Badge tone={order.status === "confirmed" ? "success" : "default"}>{order.status}</Badge>
                  </td>
                  <td>{order.paymentStatus}</td>
                  <td>₹{order.grandTotal.toLocaleString("en-IN")}</td>
                  <td className="text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
