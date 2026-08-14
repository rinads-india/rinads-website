import Link from "next/link";
import { Button, EmptyState } from "@rinads/ui";
import { getOrCreateCart, getEnrichedCartLines, getCartSubtotal } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { CartLineRow } from "@/components/CartLineRow";
import { RinpoPanel } from "@/components/RinpoPanel";

export default async function CartPage() {
  const cart = await getOrCreateCart();
  const lines = await getEnrichedCartLines(cart);
  const subtotal = await getCartSubtotal(cart);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cart</h1>
          <p className="text-sm text-muted-foreground">{lines.length} item type(s) in your cart.</p>
        </div>

        {lines.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Browse the shop and add pebbles or river stones."
            action={
              <Link href="/shop">
                <Button>Go to shop</Button>
              </Link>
            }
          />
        ) : (
          <>
            <ul className="space-y-3">
              {lines.map((line) => (
                <CartLineRow
                  key={line.lineId}
                  lineId={line.lineId}
                  quantity={line.quantity}
                  productName={line.product.name}
                  variantName={line.variant.name}
                  lineTotal={formatINR(line.lineTotal)}
                />
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rinads-primary/15 bg-surface p-4">
              <p className="text-lg font-semibold">
                Subtotal: <span className="text-rinads-primary">{formatINR(subtotal)}</span>
              </p>
              <Link href="/checkout">
                <Button>Proceed to checkout</Button>
              </Link>
            </div>
          </>
        )}
      </div>
      <RinpoPanel route="/cart" cartId={cart.id} />
    </>
  );
}
