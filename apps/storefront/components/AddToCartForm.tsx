import { Button, Input } from "@rinads/ui";
import { addToCartAction } from "@/lib/actions";

type AddToCartFormProps = {
  variantId: string;
  inStock: boolean;
};

export function AddToCartForm({ variantId, inStock }: AddToCartFormProps) {
  return (
    <form action={addToCartAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="redirectTo" value="/cart" />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Quantity</span>
        <Input
          type="number"
          name="quantity"
          min={1}
          defaultValue={1}
          className="w-24"
          disabled={!inStock}
        />
      </label>
      <Button type="submit" disabled={!inStock}>
        {inStock ? "Add to cart" : "Out of stock"}
      </Button>
    </form>
  );
}
