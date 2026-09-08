"use client";

import { Badge } from "@rinads/ui";
import type { PaymentMethod, SaleWithLines } from "@rinads/salon";
import { useActionState, useState, useTransition } from "react";
import { addSaleLineAction, finalizeSaleAction, recordPaymentAction, requestRefundAction, type FormActionState } from "./actions";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  partially_refunded: "bg-orange-100 text-orange-800",
  refunded: "bg-gray-200 text-gray-600",
  void: "bg-gray-200 text-gray-600",
};

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "upi", "card", "razorpay"];

export function SaleCard({
  sale,
  customerLabel,
  canOverridePricing,
}: {
  sale: SaleWithLines;
  customerLabel: string;
  canOverridePricing: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [addLineState, addLineAction, addLinePending] = useActionState<FormActionState, FormData>(addSaleLineAction, undefined);
  const [paymentState, paymentAction, paymentPending] = useActionState<FormActionState, FormData>(recordPaymentAction, undefined);
  const [refundState, refundAction, refundPending] = useActionState<FormActionState, FormData>(requestRefundAction, undefined);

  function handleFinalize() {
    setFinalizeError(null);
    startTransition(async () => {
      const res = await finalizeSaleAction(sale.id);
      if (!res.ok) setFinalizeError(res.error ?? "Could not finalize sale.");
    });
  }

  return (
    <div className="rounded-xl border border-rinads-primary/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{sale.saleNumber ?? "Draft sale"}</span>
            <Badge className={STATUS_TONE[sale.status] ?? "bg-gray-200 text-gray-700"}>{sale.status.replace("_", " ")}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{customerLabel}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {sale.currency} {sale.total.toLocaleString("en-IN")}
        </p>
      </div>

      <table className="mt-3 w-full text-xs">
        <tbody>
          {sale.lines.map((line) => (
            <tr key={line.id} className="border-t border-rinads-primary/5">
              <td className="py-1.5 pr-2">{line.description}</td>
              <td className="py-1.5 pr-2 text-muted-foreground">×{line.quantity}</td>
              <td className="py-1.5 text-right text-muted-foreground">
                {sale.currency} {(line.lineTotal || line.unitPrice * line.quantity - line.discountAmount).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
          {sale.lines.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-1.5 text-muted-foreground">
                No line items yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {sale.status === "draft" ? (
        <>
          <form action={addLineAction} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input type="hidden" name="saleId" value={sale.id} />
            <input name="description" placeholder="Add-on / product" className="field-input col-span-2" required />
            <input name="unitPrice" type="number" min="0" step="0.01" placeholder="Price" className="field-input" required />
            <button type="submit" disabled={addLinePending} className="btn-primary text-xs">
              {addLinePending ? "Adding…" : "Add line"}
            </button>
          </form>
          {addLineState?.error ? <p className="mt-1 text-xs text-danger">{addLineState.error}</p> : null}
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isPending || sale.lines.length === 0}
            className="btn-primary mt-3 text-xs disabled:opacity-50"
          >
            {isPending ? "Finalizing…" : "Finalize invoice"}
          </button>
          {finalizeError ? <p className="mt-1 text-xs text-danger">{finalizeError}</p> : null}
        </>
      ) : null}

      {sale.status === "awaiting_payment" ? (
        <form action={paymentAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="saleId" value={sale.id} />
          <select name="method" className="field-input w-28" defaultValue="cash">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={sale.total}
            className="field-input w-28"
            required
          />
          <button type="submit" disabled={paymentPending} className="btn-primary text-xs">
            {paymentPending ? "Recording…" : "Record payment"}
          </button>
        </form>
      ) : null}
      {paymentState?.error ? <p className="mt-1 text-xs text-danger">{paymentState.error}</p> : null}

      {sale.status === "paid" || sale.status === "partially_refunded" ? (
        <form action={refundAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="saleId" value={sale.id} />
          <input name="amount" type="number" min="0" step="0.01" placeholder="Refund amount" className="field-input w-32" required />
          <input name="reason" placeholder="Reason" className="field-input flex-1" required />
          <button type="submit" disabled={refundPending} className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50">
            {refundPending ? "Requesting…" : "Request refund"}
          </button>
        </form>
      ) : null}
      {refundState?.error ? <p className="mt-1 text-xs text-danger">{refundState.error}</p> : null}
      {!canOverridePricing && sale.discountTotal > 0 ? (
        <p className="rbac-note mt-2">A discount is applied to this sale — only an admin can change it.</p>
      ) : null}
    </div>
  );
}
