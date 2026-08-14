import Link from "next/link";
import Image from "next/image";
import { Badge, Card, EmptyState } from "@rinads/ui";
import {
  commerce,
  DEMO_CUSTOMER_ID,
  formatInr,
  orderStatusTone,
  portalContext,
} from "@/lib/commerce";

export default function DashboardPage() {
  const ctx = portalContext();
  const orders = commerce.order.listForCustomer(ctx, DEMO_CUSTOMER_ID);
  const recentOrder = orders[0];
  const recommendations = commerce.personalization.recommendations(ctx, 4);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here is your latest activity and personalized picks.
        </p>
      </header>

      <section aria-labelledby="recent-order-heading">
        <h2 id="recent-order-heading" className="mb-3 text-lg font-semibold">
          Recent order
        </h2>
        {recentOrder ? (
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{recentOrder.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(recentOrder.createdAt).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <Badge tone={orderStatusTone(recentOrder.status)}>{recentOrder.status}</Badge>
            </div>
            <p className="text-sm text-foreground">
              {recentOrder.lines.length} item{recentOrder.lines.length === 1 ? "" : "s"} ·{" "}
              {formatInr(recentOrder.grandTotal)}
            </p>
            <Link
              href={`/orders/${recentOrder.id}`}
              className="inline-flex text-sm font-medium text-rinads-primary hover:underline"
            >
              View order details
            </Link>
          </Card>
        ) : (
          <EmptyState
            title="No orders yet"
            description="When you place an order, it will appear here."
            action={
              <Link
                href="/orders"
                className="text-sm font-medium text-rinads-primary hover:underline"
              >
                Browse orders
              </Link>
            }
          />
        )}
      </section>

      <section aria-labelledby="recommendations-heading">
        <h2 id="recommendations-heading" className="mb-3 text-lg font-semibold">
          Recommended for you
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((product) => (
            <Card key={product.id} className="space-y-2">
              {product.primaryImageUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
                  <Image
                    src={product.primaryImageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
              ) : null}
              <p className="font-medium text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                from {formatInr(product.minPrice)}
              </p>
              <Badge tone={product.inStock ? "success" : "warning"}>
                {product.inStock ? "In stock" : "Out of stock"}
              </Badge>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
