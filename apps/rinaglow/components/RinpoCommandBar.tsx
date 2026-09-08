"use client";

import type { AttentionItem } from "@rinads/salon";
import { useState, useTransition } from "react";
import { resolveRinpoActionAction, runRinpoCommandAction, type RinpoCommandOutcome } from "@/app/(console)/rinpo-actions";

type ToolResult = { tool: string; ok: boolean; message: string; data?: unknown };

type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "rinpo"; kind: "clarify"; question: string }
  | { role: "rinpo"; kind: "results"; summary: string; results: ToolResult[] };

function isPendingApproval(data: unknown): data is { actionId: string; status: "pending_approval" } {
  return Boolean(data) && typeof data === "object" && (data as { status?: string }).status === "pending_approval";
}

function ApprovalRow({ actionId, canApprove }: { actionId: string; canApprove: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<string | null>(null);

  if (resolved) return <p className="mt-1 text-xs text-muted-foreground">{resolved}</p>;
  if (!canApprove) {
    return <p className="mt-1 text-xs text-muted-foreground">Waiting for an admin to approve this from the RINPO approvals list.</p>;
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await resolveRinpoActionAction(actionId, "approve");
            setResolved(res.message);
          })
        }
        className="rounded-lg bg-rinads-primary px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await resolveRinpoActionAction(actionId, "reject");
            setResolved(res.message);
          })
        }
        className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

function ResultCard({ result, canApprove }: { result: ToolResult; canApprove: boolean }) {
  const pending = isPendingApproval(result.data);
  return (
    <div className={`rounded-lg border p-2.5 text-xs ${result.ok ? "border-rinads-primary/20 bg-surface-muted" : "border-danger/30 bg-danger/5"}`}>
      <p className="font-medium text-foreground">{result.tool}</p>
      <p className="mt-0.5 text-muted-foreground">{result.message}</p>
      {pending ? <ApprovalRow actionId={(result.data as { actionId: string }).actionId} canApprove={canApprove} /> : null}
    </div>
  );
}

export function RinpoCommandBar({ canApprove }: { canApprove: boolean }) {
  const [text, setText] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastAttentionItems, setLastAttentionItems] = useState<AttentionItem[] | undefined>(undefined);
  const [lastCampaignDraftId, setLastCampaignDraftId] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const command = text.trim();
    if (!command) return;
    setText("");
    setHistory((h) => [...h, { role: "user", text: command }]);
    startTransition(async () => {
      const outcome: RinpoCommandOutcome = await runRinpoCommandAction(command, lastAttentionItems, lastCampaignDraftId);
      if (outcome.kind === "clarify") {
        setHistory((h) => [...h, { role: "rinpo", kind: "clarify", question: outcome.question }]);
        return;
      }
      setHistory((h) => [...h, { role: "rinpo", kind: "results", summary: outcome.summary, results: outcome.results }]);
      const summaryResult = outcome.results.find((r) => r.tool === "get_salon_business_summary");
      if (summaryResult?.ok && summaryResult.data && typeof summaryResult.data === "object") {
        const items = (summaryResult.data as { attentionItems?: AttentionItem[] }).attentionItems;
        if (items) setLastAttentionItems(items);
      }
      // "Preview the audience" / "approve it" / "send it" resolve against
      // whichever campaign was most recently drafted in this session.
      const draftResult = outcome.results.find(
        (r) => r.tool === "create_campaign_draft" || r.tool === "create_reactivation_draft"
      );
      if (draftResult?.ok && draftResult.data && typeof draftResult.data === "object") {
        const id = (draftResult.data as { id?: string }).id;
        if (id) setLastCampaignDraftId(id);
      }
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-6xl px-4 pb-4">
      <div className="rounded-2xl border border-rinads-primary/20 bg-surface shadow-lg">
        {open ? (
          <div className="max-h-80 space-y-2 overflow-y-auto border-b border-rinads-primary/10 p-3">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Try &ldquo;What needs attention?&rdquo; then &ldquo;Do the first three.&rdquo;
              </p>
            ) : (
              history.map((entry, i) =>
                entry.role === "user" ? (
                  <p key={i} className="text-sm font-medium text-foreground">
                    {entry.text}
                  </p>
                ) : entry.kind === "clarify" ? (
                  <p key={i} className="text-sm text-muted-foreground">
                    {entry.question}
                  </p>
                ) : (
                  <div key={i} className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">{entry.summary}</p>
                    {entry.results.map((r, j) => (
                      <ResultCard key={j} result={r} canApprove={canApprove} />
                    ))}
                  </div>
                )
              )
            )}
            {isPending ? <p className="text-xs text-muted-foreground">RINPO is working…</p> : null}
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(true);
            handleSubmit();
          }}
          className="flex items-center gap-2 p-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">RINPO</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Ask RINPO — e.g. &quot;What needs attention?&quot;"
            className="flex-1 rounded-lg border border-rinads-primary/15 bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          />
          <button type="submit" disabled={isPending || !text.trim()} className="btn-primary" aria-label="Send to RINPO">
            {isPending ? "…" : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
