"use client";

import { useActionState } from "react";
import { Button, Input } from "@rinads/ui";
import { placeOrderAction } from "@/lib/actions";

type ShippingMethod = {
  code: string;
  name: string;
  baseRate: number;
  freeAbove?: number;
};

type CheckoutFormProps = {
  shippingMethods: ShippingMethod[];
  subtotal: string;
  cartId: string;
};

export function CheckoutForm({ shippingMethods, subtotal, cartId }: CheckoutFormProps) {
  const [state, formAction, pending] = useActionState(placeOrderAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="cartId" value={cartId} />

      <div>
        <p className="mb-1 text-sm font-medium text-foreground">Cart subtotal</p>
        <p className="text-lg font-semibold text-rinads-primary">{subtotal}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Shipping method</legend>
        {shippingMethods.map((method) => (
          <label
            key={method.code}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-rinads-primary/15 bg-surface px-3 py-2 text-sm"
          >
            <input type="radio" name="shippingMethodCode" value={method.code} defaultChecked />
            <span>
              {method.name}
              {method.freeAbove
                ? ` · Free above ₹${method.freeAbove}`
                : ` · ₹${method.baseRate}`}
            </span>
          </label>
        ))}
      </fieldset>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">Promo code</span>
        <Input name="promotionCode" placeholder="WELCOME10" />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">Payment reference (demo)</span>
        <Input name="paymentReference" placeholder="demo_pay_ok" defaultValue="demo_pay_ok" />
      </label>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}
