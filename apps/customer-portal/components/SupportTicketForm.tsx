"use client";

import { useActionState } from "react";
import { Button, Input } from "@rinads/ui";
import { createSupportTicket } from "@/app/actions/support";

export function SupportTicketForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; message?: string; ticketId?: string } | null, formData: FormData) => {
      return createSupportTicket(formData);
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-foreground">
          Subject
        </label>
        <Input id="subject" name="subject" required placeholder="How can we help?" />
      </div>
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-foreground">
          Category
        </label>
        <select
          id="category"
          name="category"
          className="w-full rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2 text-sm"
          defaultValue="general"
        >
          <option value="general">General</option>
          <option value="order">Order</option>
          <option value="shipping">Shipping</option>
          <option value="returns">Returns</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="orderId" className="text-sm font-medium text-foreground">
          Order ID (optional)
        </label>
        <Input id="orderId" name="orderId" placeholder="ord_…" />
      </div>
      <div className="space-y-2">
        <label htmlFor="body" className="text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          placeholder="Describe your issue…"
          className="w-full rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Create ticket"}
      </Button>
      {state?.ok ? (
        <p className="text-sm text-green-700 dark:text-green-300" role="status">
          Ticket created ({state.ticketId}).
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="text-sm text-red-600 dark:text-red-300" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
