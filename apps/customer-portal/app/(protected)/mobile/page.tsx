import Link from "next/link";
import {
  Bot,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge, Card } from "@rinads/ui";
import {
  commerce,
  DEMO_CUSTOMER_ID,
  formatInr,
  portalContext,
} from "@/lib/commerce";

const capabilities = [
  {
    href: "/orders",
    label: "Orders",
    description: "Track purchases and fulfilment",
    icon: Package,
  },
  {
    href: "/wishlist",
    label: "Saved",
    description: "Products you want to revisit",
    icon: Heart,
  },
  {
    href: "/addresses",
    label: "Addresses",
    description: "Delivery locations and defaults",
    icon: MapPin,
  },
  {
    href: "/profile",
    label: "Identity",
    description: "Your RINADS customer profile",
    icon: UserRound,
  },
] as const;

export default function RinadsOneMobilePage() {
  const ctx = portalContext();
  const orders = commerce.order.listForCustomer(ctx, DEMO_CUSTOMER_ID);
  const recentOrder = orders[0];
  const recommendations = commerce.personalization.recommendations(ctx, 3);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24">
      <header className="overflow-hidden rounded-3xl border border-rinads-primary/15 bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="success">Mobile</Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                RINADS ONE
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              One identity. Every business.
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your customer layer for commerce, bookings, services, loyalty, support and RINPO-powered assistance.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rinads-primary/10 text-rinads-primary">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
        </div>
      </header>

      <section aria-labelledby="one-status-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              Activity
            </p>
            <h2 id="one-status-heading" className="text-lg font-semibold text-foreground">
              Your business interactions
            </h2>
          </div>
          <Link href="/" className="text-xs font-medium text-rinads-primary hover:underline">
            Dashboard
          </Link>
        </div>

        <Card className="space-y-4 rounded-3xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rinads-primary/10 text-rinads-primary">
                <ShoppingBag className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-foreground">Ambady workspace</p>
                <p className="text-xs text-muted-foreground">Commerce & customer services</p>
              </div>
            </div>
            <Badge tone={recentOrder ? "success" : "default"}>
              {recentOrder ? `${orders.length} orders` : "Connected"}
            </Badge>
          </div>

          {recentOrder ? (
            <Link
              href={`/orders/${recentOrder.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted p-4 transition hover:bg-rinads-primary/10"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Latest order
                </p>
                <p className="mt-1 font-semibold text-foreground">{recentOrder.orderNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatInr(recentOrder.grandTotal)} · {recentOrder.status}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-rinads-primary" aria-hidden />
            </Link>
          ) : null}
        </Card>
      </section>

      <section aria-labelledby="one-capabilities-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
          Capabilities
        </p>
        <h2 id="one-capabilities-heading" className="mt-1 text-lg font-semibold text-foreground">
          Everything you need from one app
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {capabilities.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-3xl border border-rinads-primary/10 bg-surface p-4 transition hover:border-rinads-primary/30 hover:bg-rinads-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rinads-primary/10 text-rinads-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="mt-4 font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="one-rinpo-heading">
        <Card className="rounded-3xl border-rinads-primary/20 bg-rinads-primary/5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rinads-primary text-white">
              <Bot className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
                RINPO
              </p>
              <h2 id="one-rinpo-heading" className="mt-1 text-lg font-semibold text-foreground">
                Your intelligent business interface
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the RINPO panel to understand orders, products, support and the actions available in your current workspace.
              </p>
              <Link
                href="/support"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
              >
                Ask for help <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {recommendations.length > 0 ? (
        <section aria-labelledby="one-recommendations-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
            Intelligence
          </p>
          <h2 id="one-recommendations-heading" className="mt-1 text-lg font-semibold text-foreground">
            Recommended for you
          </h2>
          <div className="mt-3 space-y-3">
            {recommendations.map((product) => (
              <Card key={product.id} className="flex items-center justify-between gap-4 rounded-2xl">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{product.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">from {formatInr(product.minPrice)}</p>
                </div>
                <Badge tone={product.inStock ? "success" : "warning"}>
                  {product.inStock ? "Available" : "Unavailable"}
                </Badge>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <nav
        aria-label="RINADS ONE mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center justify-around rounded-3xl border border-rinads-primary/15 bg-surface/95 px-2 py-2 shadow-lg backdrop-blur"
      >
        <Link href="/mobile" className="flex min-w-14 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-rinads-primary">
          <Home className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold">One</span>
        </Link>
        <Link href="/orders" className="flex min-w-14 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-muted-foreground hover:text-rinads-primary">
          <Package className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold">Orders</span>
        </Link>
        <Link href="/wishlist" className="flex min-w-14 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-muted-foreground hover:text-rinads-primary">
          <Heart className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold">Saved</span>
        </Link>
        <Link href="/profile" className="flex min-w-14 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-muted-foreground hover:text-rinads-primary">
          <UserRound className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
