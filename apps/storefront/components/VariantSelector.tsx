"use client";

import { useRouter } from "next/navigation";
import { Button } from "@rinads/ui";

type VariantSelectorProps = {
  variants: { id: string; name: string; price: number; stock: number }[];
  selectedVariantId: string;
  slug: string;
};

export function VariantSelector({ variants, selectedVariantId, slug }: VariantSelectorProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => (
        <Button
          key={variant.id}
          type="button"
          variant={variant.id === selectedVariantId ? "primary" : "secondary"}
          className="text-xs"
          onClick={() => router.push(`/products/${slug}?variant=${variant.id}`)}
        >
          {variant.name}
          {variant.stock <= 0 ? " (OOS)" : ""}
        </Button>
      ))}
    </div>
  );
}
