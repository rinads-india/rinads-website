import { notFound } from "next/navigation";
import { Badge, Card } from "@rinads/ui";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import { getCartForDisplay } from "@/lib/cart";
import { RinpoPanel } from "@/components/RinpoPanel";

type OrderTrackPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderTrackPage({ params }: OrderTrackPageProps) {
  const { id } = await params;
  const ctx = getCommerceContext();
  const cart = await getCartForDisplay();

  const result = commerce.order.getById(ctx, id, ctx.customerId);
  if (!result.ok) notFound();

  const order = result.data;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="success">{order.status}</Badge>
            <Badge>{order.fulfilmentStatus}</Badge>
            <Badge tone="default">Payment: {order.paymentStatus}</Badge>
          </div>
        </div>

        <Card className="space-y-3">
          <h2 className="font-semibold text-foreground">Timeline</h2>
          <ol className="relative space-y-4 border-l border-rinads-primary/20 pl-4">
            {order.events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-rinads-primary" />
                <p className="font-medium text-foreground">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.occurredAt).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-foreground">Items</h2>
          <ul className="space-y-2 text-sm">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-2">
                <span>
                  {line.productName} ({line.variantName}) × {line.quantity}
                </span>
                <span>{formatINR(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-rinads-primary/10 pt-2 font-semibold">
            Total {formatINR(order.grandTotal)}
          </p>
        </Card>
      </div>
      <RinpoPanel route={`/orders/${id}/track`} cartId={cart?.id} orderId={id} />
    </>
  );
}
