"use client";

import { useRouter } from "next/navigation";
import { Button, Input } from "@rinads/ui";
import { updateCartLineAction, removeCartLineAction } from "@/lib/actions";

type CartLineRowProps = {
  lineId: string;
  quantity: number;
  productName: string;
  variantName: string;
  lineTotal: string;
};

export function CartLineRow({
  lineId,
  quantity,
  productName,
  variantName,
  lineTotal,
}: CartLineRowProps) {
  const router = useRouter();

  async function handleUpdate(formData: FormData) {
    await updateCartLineAction(formData);
    router.refresh();
  }

  async function handleRemove(formData: FormData) {
    await removeCartLineAction(formData);
    router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rinads-primary/15 bg-surface p-4">
      <div>
        <p className="font-semibold text-foreground">{productName}</p>
        <p className="text-sm text-muted-foreground">{variantName}</p>
      </div>
      <div className="flex items-center gap-3">
        <form action={handleUpdate} className="flex items-center gap-2">
          <input type="hidden" name="lineId" value={lineId} />
          <Input
            type="number"
            name="quantity"
            min={1}
            defaultValue={quantity}
            className="w-20"
          />
          <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
            Update
          </Button>
        </form>
        <p className="min-w-[5rem] text-right text-sm font-semibold">{lineTotal}</p>
        <form action={handleRemove}>
          <input type="hidden" name="lineId" value={lineId} />
          <Button type="submit" variant="ghost" className="px-2 py-1 text-xs text-red-600">
            Remove
          </Button>
        </form>
      </div>
    </li>
  );
}
