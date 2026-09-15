"use client";

import type { SalonCampaignRecipient } from "@rinads/salon";
import { Badge } from "@rinads/ui";
import { useState, useTransition } from "react";
import { retryMessageAction } from "../actions";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  sent: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-gray-200 text-gray-600",
  converted: "bg-purple-100 text-purple-800",
};

function RecipientRow({
  campaignId,
  recipient,
  label,
  canManage,
}: {
  campaignId: string;
  recipient: SalonCampaignRecipient;
  label: string;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [retried, setRetried] = useState(false);

  function retry() {
    if (!recipient.notificationOutboxId) return;
    setError(null);
    startTransition(async () => {
      const res = await retryMessageAction(campaignId, recipient.notificationOutboxId!);
      if (!res.ok) setError(res.error ?? "Could not retry message.");
      else setRetried(true);
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rinads-primary/10 p-2.5 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <Badge className={STATUS_TONE[recipient.status] ?? "bg-surface-muted text-foreground"}>{recipient.status}</Badge>
        </div>
        {recipient.skipReason ? <p className="mt-0.5 text-xs text-muted-foreground">{recipient.skipReason}</p> : null}
        {error ? <p className="mt-0.5 text-xs text-danger">{error}</p> : null}
      </div>
      {canManage && recipient.status === "failed" && recipient.notificationOutboxId && !retried ? (
        <button
          type="button"
          disabled={isPending}
          onClick={retry}
          className="rounded-lg border border-rinads-primary/40 px-2 py-1 text-xs font-medium text-rinads-primary hover:bg-rinads-primary/10 disabled:opacity-50"
        >
          Retry
        </button>
      ) : retried ? (
        <span className="text-xs text-emerald-700">Queued for retry</span>
      ) : null}
    </li>
  );
}

export function RecipientsList({
  campaignId,
  recipients,
  customerLabels,
  canManage,
}: {
  campaignId: string;
  recipients: SalonCampaignRecipient[];
  customerLabels: Record<string, string>;
  canManage: boolean;
}) {
  return (
    <ul className="mt-3 space-y-2">
      {recipients.map((r) => (
        <RecipientRow key={r.id} campaignId={campaignId} recipient={r} label={customerLabels[r.customerId] ?? r.customerId} canManage={canManage} />
      ))}
    </ul>
  );
}
