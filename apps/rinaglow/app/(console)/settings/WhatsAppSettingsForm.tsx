"use client";

import { useActionState } from "react";
import type { WhatsAppMode } from "@rinads/salon-server";
import { saveWhatsAppSettingsAction } from "./actions";

export function WhatsAppSettingsForm({
  sendEnabled,
  mode,
  sandboxAllowlist,
}: {
  sendEnabled: boolean;
  mode: WhatsAppMode;
  sandboxAllowlist: string[];
}) {
  const [state, formAction, isPending] = useActionState(saveWhatsAppSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-rinads-primary/10 p-4">
      <p className="text-sm font-semibold text-foreground">Salon WhatsApp controls</p>
      <p className="text-xs text-muted-foreground">
        These settings never store Twilio credentials. Production sending still needs the founder worker tick and
        Edge Function secrets. Prefer sandbox + an allowlist until that evidence exists.
      </p>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input type="checkbox" name="sendEnabled" value="1" defaultChecked={sendEnabled} className="mt-1" />
        <span>
          Enable send flag for this salon (<code>salon.whatsapp.send_enabled</code>)
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Off by default. Leave this unchecked unless you are running a founder-supervised sandbox tick.
          </span>
        </span>
      </label>

      <div>
        <label className="field-label" htmlFor="whatsapp-mode">
          Mode
        </label>
        <select id="whatsapp-mode" name="mode" defaultValue={mode} className="field-input">
          <option value="off">Off — enqueue only</option>
          <option value="sandbox">Sandbox — allowlisted numbers only</option>
          <option value="live">Live — every eligible recipient (do not use until sandbox evidence)</option>
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="sandbox-allowlist">
          Sandbox allowlist (one phone per line)
        </label>
        <textarea
          id="sandbox-allowlist"
          name="sandboxAllowlist"
          rows={4}
          defaultValue={sandboxAllowlist.join("\n")}
          className="field-input font-mono text-xs"
          placeholder={"+919000000001"}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Saving…" : "Save WhatsApp settings"}
      </button>
      {state?.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state && !state.error ? <p className="text-xs text-emerald-700">Saved. Delivery stays off until the worker and Twilio sandbox are enabled.</p> : null}
    </form>
  );
}
