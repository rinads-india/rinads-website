import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@rinads/ui";
import { commerce, demoContext } from "@/lib/commerce";
import { OrderStatusForm } from "./OrderStatusForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = demoContext();
  const result = commerce.order.getById(ctx, id);

  if (!result.ok) notFound();

  const order = result.data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-rinads-primary hover:underline">
          ← Orders
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{order.orderNumber}</h2>
        <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge tone="success" className="mt-2">
            {order.status}
          </Badge>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Payment</p>
          <p className="mt-2 font-medium">{order.paymentStatus}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Grand total</p>
          <p className="mt-2 text-xl font-bold">₹{order.grandTotal.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <p className="font-medium">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">{line.variantName}</p>
                </td>
                <td>{line.sku}</td>
                <td>{line.quantity}</td>
                <td>₹{line.unitPrice.toLocaleString("en-IN")}</td>
                <td>₹{(line.unitPrice * line.quantity).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="section-title">Timeline</h3>
        <ol className="space-y-3">
          {order.events.map((event) => (
            <li key={event.id} className="flex gap-3 text-sm">
              <span className="text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</span>
              <span>{event.label}</span>
            </li>
          ))}
        </ol>
      </Card>

      <OrderStatusForm order={order} />
    </div>
  );
}
