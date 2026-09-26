"use client";

import { useActionState } from "react";
import { Badge, Button, Card, Input } from "@rinads/ui";
import type { Product, ProductVariant } from "@rinads/commerce";
import { saveProduct, type SaveProductState } from "./actions";

type ProductEditorFormProps = {
  product: Product;
  variants: ProductVariant[];
};

const initialState: SaveProductState = { ok: false };

export function ProductEditorForm({ product, variants }: ProductEditorFormProps) {
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="variantIds" value={variants.map((v) => v.id).join(",")} />

      <Card className="space-y-4">
        <h3 className="section-title">Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Name</span>
            <Input name="name" defaultValue={product.name} required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Slug</span>
            <Input name="slug" defaultValue={product.slug} required />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            defaultValue={product.description}
            rows={4}
            className="w-full rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2 text-sm"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Category</span>
            <Input name="categorySlug" defaultValue={product.categorySlug} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Tags (comma-separated)</span>
            <Input name="tags" defaultValue={product.tags.join(", ")} />
          </label>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="section-title">Variants</h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Variant</th>
                <th>SKU</th>
                <th>Price (₹)</th>
                <th>Compare at</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id}>
                  <td>
                    <Input name={`variant_${variant.id}_name`} defaultValue={variant.name} />
                  </td>
                  <td>
                    <Input name={`variant_${variant.id}_sku`} defaultValue={variant.sku} />
                  </td>
                  <td>
                    <Input
                      name={`variant_${variant.id}_price`}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={variant.price}
                    />
                  </td>
                  <td>
                    <Input
                      name={`variant_${variant.id}_compareAtPrice`}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={variant.compareAtPrice ?? ""}
                    />
                  </td>
                  <td>
                    <Input
                      name={`variant_${variant.id}_stock`}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={variant.stock}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="section-title">Pricing &amp; stock</h3>
        <p className="text-sm text-muted-foreground">
          Variant prices and inventory are edited in the table above. Totals are recalculated on save via{" "}
          <code className="text-xs">catalog.upsertProduct</code>.
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge tone="default">Min ₹{Math.min(...variants.map((v) => v.price))}</Badge>
          <Badge tone="default">Max ₹{Math.max(...variants.map((v) => v.price))}</Badge>
          <Badge tone="success">Total stock {variants.reduce((s, v) => s + v.stock, 0)}</Badge>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="section-title">Publish status</h3>
        <label className="block max-w-xs space-y-1">
          <span className="text-sm font-medium">Status</span>
          <select
            name="status"
            defaultValue={product.status}
            className="w-full rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">SEO title</span>
            <Input name="seoTitle" defaultValue={product.seoTitle ?? ""} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">SEO description</span>
            <Input name="seoDescription" defaultValue={product.seoDescription ?? ""} />
          </label>
        </div>
        <p className="rounded-lg border border-dashed border-rinads-primary/20 bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
          Search preview: <span className="font-medium text-rinads-primary">{product.seoTitle || product.name}</span>
          {" · "}
          {(product.seoDescription || product.description).slice(0, 140)}
        </p>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save product"}
        </Button>
        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
