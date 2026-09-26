"use client";

import { useActionState } from "react";
import { Button, Card, Input } from "@rinads/ui";
import type { Order, OrderStatus } from "@rinads/commerce";
import { updateOrderStatus, type UpdateOrderStatusState } from "./actions";

const STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "cancelled",
  "return_requested",
  "returned",
  "refund_pending",
  "refunded",
  "delivery_failed",
];

const initialState: UpdateOrderStatusState = { ok: false };

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, formAction, pending] = useActionState(updateOrderStatus, initialState);

  return (
    <Card className="space-y-4">
      <h3 className="section-title">Update status</h3>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="orderId" value={order.id} />
        <label className="block space-y-1">
          <span className="text-sm font-medium">Status</span>
          <select
            name="status"
            defaultValue={order.status}
            className="rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[200px] flex-1 space-y-1">
          <span className="text-sm font-medium">Timeline label</span>
          <Input name="label" defaultValue={`Status updated to ${order.status}`} />
        </label>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Updating…" : "Update"}
        </Button>
      </form>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}
    </Card>
  );
}
