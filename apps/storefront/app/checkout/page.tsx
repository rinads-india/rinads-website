import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@rinads/ui";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { getOrCreateCart, getEnrichedCartLines, getCartSubtotal } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { CheckoutForm } from "@/components/CheckoutForm";
import { RinpoPanel } from "@/components/RinpoPanel";

export default async function CheckoutPage() {
  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();
  const lines = await getEnrichedCartLines(cart);

  if (lines.length === 0) {
    redirect("/cart");
  }

  const subtotal = await getCartSubtotal(cart);
  const shippingMethods = commerce.shipping.listMethods(ctx);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">Review shipping and complete your demo order.</p>
          </div>

          <CheckoutForm
            shippingMethods={shippingMethods}
            subtotal={formatINR(subtotal)}
            cartId={cart.id}
          />
        </div>

        <aside className="space-y-4 rounded-xl border border-rinads-primary/15 bg-surface p-4">
          <h2 className="font-semibold text-foreground">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {lines.map((line) => (
              <li key={line.lineId} className="flex justify-between gap-2">
                <span>
                  {line.product.name} × {line.quantity}
                </span>
                <span className="font-medium">{formatINR(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-rinads-primary/10 pt-2 text-sm font-semibold">
            Subtotal {formatINR(subtotal)}
          </p>
          <Link href="/cart" className="block">
            <Button variant="secondary" className="w-full">
              Back to cart
            </Button>
          </Link>
        </aside>
      </div>

      {/* Compact panel so checkout controls stay visible */}
      <RinpoPanel route="/checkout" cartId={cart.id} compact />
    </>
  );
}
