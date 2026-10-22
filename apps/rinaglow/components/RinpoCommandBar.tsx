"use client";

import type { AttentionItem } from "@rinads/salon";
import Image from "next/image";
import { useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveRinpoActionAction, runRinpoCommandAction, type RinpoCommandOutcome } from "@/app/(console)/rinpo-actions";
import { getRinpoPageContext } from "@/lib/rinpo-page-context";

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
    <div className={`rounded-xl border p-2.5 text-xs ${result.ok ? "border-rinads-primary/20 bg-surface-muted" : "border-danger/30 bg-danger/5"}`}>
      <p className="font-medium text-foreground">{result.tool}</p>
      <p className="mt-0.5 text-muted-foreground">{result.message}</p>
      {pending ? <ApprovalRow actionId={(result.data as { actionId: string }).actionId} canApprove={canApprove} /> : null}
    </div>
  );
}

export function RinpoCommandBar({ canApprove }: { canApprove: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastAttentionItems, setLastAttentionItems] = useState<AttentionItem[] | undefined>(undefined);
  const [lastCampaignDraftId, setLastCampaignDraftId] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pageContext = getRinpoPageContext(pathname, searchParams);

  function handleSubmit() {
    const command = text.trim();
    if (!command) return;
    setText("");
    setHistory((h) => [...h, { role: "user", text: command }]);
    startTransition(async () => {
      const outcome: RinpoCommandOutcome = await runRinpoCommandAction(
        command,
        lastAttentionItems,
        lastCampaignDraftId,
        pageContext
      );
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
    <div className="rinpo-command-bar fixed inset-x-0 bottom-[5.2rem] z-[45] mx-auto max-w-5xl px-3 pb-2 lg:bottom-0 lg:px-4 lg:pb-4">
      <div className="rounded-[1.25rem] border border-rinads-primary/20 bg-surface/95 shadow-[0_18px_45px_rgba(42,15,66,0.16)] backdrop-blur-xl">
        {open ? (
          <div className="rg-popover max-h-[42dvh] space-y-2 overflow-y-auto border-b border-rinads-primary/10 p-3 sm:max-h-80">
            <div className="sticky top-0 z-10 -mx-1 -mt-1 flex items-center justify-between rounded-xl bg-surface/95 px-1 py-1 backdrop-blur">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/rinpo-face.png"
                  alt="RINPO"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-rinads-primary/20"
                />
                <div>
                  <p className="text-xs font-semibold text-foreground">RINPO</p>
                  <p className="text-[10px] text-muted-foreground">Context-aware salon assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-muted text-lg text-foreground"
                aria-label="Collapse RINPO"
              >
                ×
              </button>
            </div>
            {history.length === 0 ? (
              <p className="rounded-xl bg-surface-muted p-3 text-xs text-muted-foreground">
                Try &ldquo;What needs attention?&rdquo; then &ldquo;Do the first three.&rdquo;
              </p>
            ) : (
              history.map((entry, i) =>
                entry.role === "user" ? (
                  <p key={i} className="ml-auto max-w-[88%] rounded-xl bg-rinads-primary px-3 py-2 text-sm font-medium text-white">
                    {entry.text}
                  </p>
                ) : entry.kind === "clarify" ? (
                  <p key={i} className="max-w-[92%] rounded-xl bg-surface-muted px-3 py-2 text-sm text-foreground">
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
            {isPending ? <p className="text-xs font-medium text-rinads-primary">RINPO is working…</p> : null}
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(true);
            handleSubmit();
          }}
          className="flex items-center gap-2 p-2.5 sm:p-3"
        >
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary/50"
            aria-label={open ? "Collapse RINPO" : "Open RINPO"}
            aria-expanded={open}
          >
            <Image
              src="/assets/rinpo-face.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-rinads-primary/25"
              aria-hidden
            />
          </button>
          <span className="hidden text-xs font-semibold uppercase tracking-wide text-rinads-primary sm:inline">RINPO</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Ask RINPO…"
            className="h-11 min-w-0 flex-1 rounded-xl border border-rinads-primary/15 bg-surface-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="btn-primary h-11 shrink-0 rounded-xl px-3 sm:px-4"
            aria-label="Send to RINPO"
          >
            {isPending ? "…" : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
