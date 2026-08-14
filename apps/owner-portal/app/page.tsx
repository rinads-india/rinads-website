import Link from "next/link";
import { Badge, Card } from "@rinads/ui";
import {
  countOpenTickets,
  demoContext,
  listAllProducts,
  listOrgOrders,
} from "@/lib/commerce";

export default function DashboardPage() {
  const ctx = demoContext();
  const orders = listOrgOrders(ctx);
  const products = listAllProducts(ctx);
  const openTickets = countOpenTickets(ctx);
  const draftCount = products.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization overview from the Ambady commerce store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{orders.length}</p>
          <Link href="/orders" className="mt-3 inline-block text-sm text-rinads-primary hover:underline">
            View all orders
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Products</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{products.length}</p>
          {draftCount > 0 ? (
            <Badge tone="warning" className="mt-2">
              {draftCount} draft{draftCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          <Link href="/products" className="mt-3 inline-block text-sm text-rinads-primary hover:underline">
            Manage catalog
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Open tickets</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{openTickets}</p>
          <Link href="/support" className="mt-3 inline-block text-sm text-rinads-primary hover:underline">
            Support queue
          </Link>
        </Card>
      </div>

      <section>
        <h3 className="section-title">Recent orders</h3>
        {orders.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">No orders yet. Place a test order via the storefront checkout.</p>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/orders/${order.id}`} className="font-medium text-rinads-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <Badge tone={order.status === "confirmed" ? "success" : "default"}>{order.status}</Badge>
                    </td>
                    <td>₹{order.grandTotal.toLocaleString("en-IN")}</td>
                    <td className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
