"use client";

import type { CampaignStatus } from "@rinads/salon";
import { useState, useTransition } from "react";
import { approveCampaignAction, cancelCampaignAction, sendCampaignAction } from "../actions";

export function CampaignActions({
  campaignId,
  status,
  canApproveOrSend,
}: {
  campaignId: string;
  status: CampaignStatus;
  canApproveOrSend: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function approve() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await approveCampaignAction(campaignId, status);
      if (!res.ok) setError(res.error ?? "Could not approve campaign.");
    });
  }

  function send() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await sendCampaignAction(campaignId, status);
      if (!res.ok) setError(res.error ?? "Could not send campaign.");
      else setMessage(`Queued ${res.queued ?? 0} message(s), skipped ${res.skipped ?? 0}.`);
    });
  }

  function cancel() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await cancelCampaignAction(campaignId, status);
      if (!res.ok) setError(res.error ?? "Could not cancel campaign.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        {canApproveOrSend && status === "draft" ? (
          <button type="button" disabled={isPending} onClick={approve} className="btn-primary text-xs">
            Approve
          </button>
        ) : null}
        {canApproveOrSend && status === "approved" ? (
          <button type="button" disabled={isPending} onClick={send} className="btn-primary text-xs">
            Send now
          </button>
        ) : null}
        {canApproveOrSend && (status === "draft" || status === "approved") ? (
          <button
            type="button"
            disabled={isPending}
            onClick={cancel}
            className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
    </div>
  );
}
