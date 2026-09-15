"use client";

import { Input } from "@rinads/ui";
import { useActionState, useEffect, useRef } from "react";
import { createCampaignDraftAction } from "./actions";

export function CampaignDraftForm() {
  const [state, formAction, isPending] = useActionState(createCampaignDraftAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="field-label" htmlFor="name">
          Campaign name
        </label>
        <Input id="name" name="name" placeholder="90-day reactivation" required />
      </div>
      <div>
        <label className="field-label" htmlFor="campaignType">
          Type
        </label>
        <select id="campaignType" name="campaignType" defaultValue="custom" className="field-input">
          <option value="custom">Custom</option>
          <option value="reactivation">Reactivation</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="channel">
          Channel
        </label>
        <select id="channel" name="channel" defaultValue="whatsapp" className="field-input">
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div className="flex items-center gap-2 pt-6">
        <input id="communicationOptIn" name="communicationOptIn" type="checkbox" defaultChecked value="true" className="h-4 w-4" />
        <label htmlFor="communicationOptIn" className="text-xs text-muted-foreground">
          Exclude opted-out customers (recommended)
        </label>
      </div>

      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="lastVisitBeforeDays">
          Inactive for at least (days)
        </label>
        <Input id="lastVisitBeforeDays" name="lastVisitBeforeDays" type="number" min={0} placeholder="90" />
      </div>
      <div>
        <label className="field-label" htmlFor="minVisits">
          Min visits
        </label>
        <Input id="minVisits" name="minVisits" type="number" min={0} placeholder="1" />
      </div>
      <div>
        <label className="field-label" htmlFor="minLifetimeSpend">
          Min lifetime spend (INR)
        </label>
        <Input id="minLifetimeSpend" name="minLifetimeSpend" type="number" min={0} placeholder="5000" />
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        <label className="field-label" htmlFor="messageBody">
          Message body
        </label>
        <textarea
          id="messageBody"
          name="messageBody"
          required
          rows={3}
          placeholder="Hi {{name}}, we miss you! Book your next visit and get 15% off this week."
          className="field-input w-full"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Drafting…" : "Create draft"}
        </button>
        <p className="text-xs text-muted-foreground">Drafts never send automatically — preview the audience, then approve and send.</p>
      </div>
      {state?.error ? <p className="text-xs text-danger sm:col-span-2 lg:col-span-4">{state.error}</p> : null}
    </form>
  );
}
