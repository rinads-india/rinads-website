import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, ErrorState } from "@rinads/ui";
import { OrderTimeline } from "@/components/OrderTimeline";
import {
  commerce,
  DEMO_CUSTOMER_ID,
  formatInr,
  orderStatusTone,
  portalContext,
} from "@/lib/commerce";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = portalContext();
  const result = commerce.order.getById(ctx, id, DEMO_CUSTOMER_ID);

  if (!result.ok) {
    if (result.error.code === "FORBIDDEN" || result.error.code === "ORDER_NOT_FOUND") {
      notFound();
    }
    return (
      <ErrorState title="Unable to load order" message={result.error.message} />
    );
  }

  const order = result.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/orders" className="text-sm text-rinads-primary hover:underline">
          ← Back to orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
          <Badge tone={orderStatusTone(order.status)}>{order.status}</Badge>
          <Badge tone="default">{order.fulfilmentStatus.replace(/_/g, " ")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Placed{" "}
          {new Date(order.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Items</h2>
          <ul className="divide-y divide-rinads-primary/10">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{line.productName}</p>
                  <p className="text-muted-foreground">
                    {line.variantName} · SKU {line.sku} · Qty {line.quantity}
                  </p>
                </div>
                <p className="font-medium">{formatInr(line.unitPrice * line.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-rinads-primary/10 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatInr(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{formatInr(order.shippingTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatInr(order.taxTotal)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{formatInr(order.grandTotal)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <OrderTimeline events={order.events} />
        </Card>
      </div>
    </div>
  );
}
