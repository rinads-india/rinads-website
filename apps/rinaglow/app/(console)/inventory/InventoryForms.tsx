"use client";

import type { SalonBranch, SalonProduct } from "@rinads/salon";
import { useActionState } from "react";
import { adjustStockAction, createProductAction, type FormActionState } from "./actions";

export function NewProductForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(createProductAction, undefined);
  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input name="name" className="field-input" placeholder="Product name" required />
      <input name="category" className="field-input" placeholder="Category" defaultValue="retail" />
      <input name="sku" className="field-input" placeholder="SKU (optional)" />
      <input name="reorderAt" type="number" min="0" step="1" className="field-input" placeholder="Reorder at" defaultValue={4} />
      <button type="submit" className="btn-primary text-xs" disabled={pending}>
        {pending ? "Adding…" : "Add product"}
      </button>
      {state?.error ? <p className="text-xs text-danger sm:col-span-2 lg:col-span-5">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-emerald-700 sm:col-span-2 lg:col-span-5">{state.success}</p> : null}
    </form>
  );
}

export function AdjustStockForm({ branch, product }: { branch: SalonBranch; product: SalonProduct }) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(adjustStockAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-1">
      <input type="hidden" name="branchId" value={branch.id} />
      <input type="hidden" name="productId" value={product.id} />
      <input name="delta" type="number" step="1" className="field-input w-20 py-1" placeholder="+/−" required />
      <button type="submit" className="btn-secondary px-2 py-1 text-xs" disabled={pending}>
        {pending ? "…" : "Save"}
      </button>
      {state?.error ? <span className="text-[11px] text-danger">{state.error}</span> : null}
    </form>
  );
}
