"use client";

import type { AttentionItem } from "@rinads/salon";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveRinpoActionAction, runRinpoCommandAction, type RinpoCommandOutcome } from "@/app/(console)/rinpo-actions";
import { getRinpoPageContext } from "@/lib/rinpo-page-context";

type ToolResult = { tool: string; ok: boolean; message: string; data?: unknown };

type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "rinpo"; kind: "clarify"; question: string }
  | { role: "rinpo"; kind: "results"; summary: string; results: ToolResult[] };

type VoiceLang = "en" | "ml";

type SpeechRecognitionResultLike = { 0?: { transcript?: string } };
type SpeechRecognitionEventLike = { results?: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

const DEFAULT_QUICK_COMMANDS = [
  "What needs attention?",
  "Show today's appointments",
  "Show pending payments",
  "Show growth opportunities",
] as const;

const QUICK_COMMANDS_BY_AREA: Record<string, readonly string[]> = {
  Today: DEFAULT_QUICK_COMMANDS,
  "Front Desk": [
    "Show today's appointments",
    "Show empty slots today",
    "Show pending payments",
    "What needs attention?",
  ],
  Calendar: [
    "Show today's appointments",
    "Show empty slots today",
    "Show staff utilization",
    "What needs attention?",
  ],
  POS: [
    "Show pending payments",
    "Show revenue for the last 30 days",
    "Show service performance",
    "What needs attention?",
  ],
  Clients: [
    "Show customers inactive for 45 days",
    "Show loyalty summary",
    "Show growth opportunities",
    "What needs attention?",
  ],
  Growth: [
    "Show growth opportunities",
    "Show campaign performance",
    "Show failed messages",
    "Show customers inactive for 45 days",
  ],
  Loyalty: [
    "Show loyalty summary",
    "Show review workflow summary",
    "Show recovery summary",
    "Show customers inactive for 45 days",
  ],
  Campaigns: [
    "Show campaign performance",
    "Show failed messages",
    "Show growth opportunities",
    "What needs attention?",
  ],
  Communications: [
    "Show failed messages",
    "Show campaign performance",
    "Show review workflow summary",
    "What needs attention?",
  ],
  Services: [
    "Show service performance",
    "Show revenue for the last 30 days",
    "Show growth opportunities",
    "What needs attention?",
  ],
  Staff: [
    "Show staff utilization",
    "Show today's appointments",
    "Show empty slots today",
    "What needs attention?",
  ],
};

const TOOL_LABELS: Record<string, string> = {
  get_today_appointments: "Today's appointments",
  get_salon_business_summary: "Salon summary",
  get_pending_payments: "Pending payments",
  get_empty_slots: "Available slots",
  get_staff_utilization: "Staff utilization",
  get_loyalty_summary: "Loyalty summary",
  get_review_workflow_summary: "Review workflow",
  get_campaign_performance: "Campaign performance",
  get_failed_messages: "Failed messages",
};

function salonAreaFromPathname(pathname: string): string {
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const labels: Record<string, string> = {
    dashboard: "Today",
    "front-desk": "Front Desk",
    calendar: "Calendar",
    pos: "POS",
    inventory: "Inventory",
    services: "Services",
    staff: "Staff",
    clients: "Clients",
    growth: "Growth",
    loyalty: "Loyalty",
    campaigns: "Campaigns",
    communications: "Communications",
    settings: "Settings",
  };
  return labels[firstSegment] ?? firstSegment.replace(/-/g, " ");
}

function toolLabel(tool: string): string {
  if (TOOL_LABELS[tool]) return TOOL_LABELS[tool];
  const label = tool
    .replace(/^(get|show|list|create|update)_/, "")
    .replace(/_/g, " ")
    .trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "RINPO action";
}

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
    <div
      className={`rounded-xl border p-3 ${
        result.ok ? "border-rinads-primary/15 bg-surface" : "border-danger/30 bg-danger/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-foreground">{toolLabel(result.tool)}</p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
            result.ok ? "bg-emerald-50 text-emerald-700" : "bg-danger/10 text-danger"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${result.ok ? "bg-emerald-500" : "bg-danger"}`} aria-hidden />
          {result.ok ? "Live" : "Issue"}
        </span>
      </div>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{result.message}</p>
      {pending ? <ApprovalRow actionId={(result.data as { actionId: string }).actionId} canApprove={canApprove} /> : null}
    </div>
  );
}

function speakText(text: string, lang: VoiceLang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "ml" ? "ml-IN" : "en-IN";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export function RinpoCommandBar({ canApprove }: { canApprove: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastAttentionItems, setLastAttentionItems] = useState<AttentionItem[] | undefined>(undefined);
  const [lastCampaignDraftId, setLastCampaignDraftId] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("en");
  const [isListening, setIsListening] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pageContext = getRinpoPageContext(pathname, searchParams);
  const salonArea = salonAreaFromPathname(pathname);
  const quickCommands = QUICK_COMMANDS_BY_AREA[salonArea] ?? DEFAULT_QUICK_COMMANDS;

  function runCommand(command: string, speakReply = false) {
    const normalized = command.trim();
    if (!normalized || isPending) return;
    setOpen(true);
    setText("");
    setHistory((h) => [...h, { role: "user", text: normalized }]);

    startTransition(async () => {
      const outcome: RinpoCommandOutcome = await runRinpoCommandAction(
        normalized,
        lastAttentionItems,
        lastCampaignDraftId,
        pageContext
      );

      if (outcome.kind === "clarify") {
        setHistory((h) => [...h, { role: "rinpo", kind: "clarify", question: outcome.question }]);
        if (speakReply) speakText(outcome.question, voiceLang);
        return;
      }

      setHistory((h) => [...h, { role: "rinpo", kind: "results", summary: outcome.summary, results: outcome.results }]);
      if (speakReply) speakText(outcome.summary, voiceLang);

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

  function startVoiceCommand() {
    if (typeof window === "undefined" || isPending) return;
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setOpen(true);
      setHistory((h) => [
        ...h,
        {
          role: "rinpo",
          kind: "clarify",
          question: "Voice input is not available in this browser. You can still type the same command here.",
        },
      ]);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = voiceLang === "ml" ? "ml-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) runCommand(transcript, true);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    setOpen(true);
    setIsListening(true);
    recognition.start();
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close RINPO Phone"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-[#11091c]/25 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      {open ? (
        <section
          className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[70] mx-auto flex max-h-[min(72dvh,680px)] max-w-[430px] flex-col overflow-hidden rounded-[1.5rem] border border-rinads-primary/15 bg-surface shadow-[0_24px_70px_rgba(42,15,66,0.24)] lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:w-[430px] lg:max-h-[min(720px,calc(100dvh-3rem))]"
          role="dialog"
          aria-modal="false"
          aria-label="RI SALON RINASPACE RINPO Phone"
        >
          <header className="shrink-0 border-b border-rinads-primary/10 bg-gradient-to-br from-rinads-primary/10 via-surface to-surface px-4 pb-2.5 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-rinads-primary/15 bg-surface shadow-sm">
                  <Image src="/assets/rinpo-face.png" alt="RINPO" fill sizes="44px" className="object-contain p-0.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">RI SALON RINASPACE</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="truncate text-base font-semibold text-foreground">RINPO Phone</h2>
                    <span className="hidden text-[9px] font-medium text-muted-foreground sm:inline">RINPO Runtime</span>
                  </div>
                  <p className="truncate text-[9px] text-muted-foreground">Powered by RINADS Intelligence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rinads-primary/10 bg-surface-muted text-lg leading-none text-foreground transition hover:bg-rinads-primary/10"
                aria-label="Close RINPO Phone"
              >
                ×
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 whitespace-nowrap rounded-full border border-rinads-primary/15 bg-surface px-2.5 py-1 font-medium text-foreground/80">
                {salonArea}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-rinads-primary/15 bg-surface px-2.5 py-1 font-medium text-foreground/80">
                {pageContext.defaultBranchId ? "Store active" : "All stores"}
              </span>
              <button
                type="button"
                onClick={() => setVoiceLang((value) => (value === "en" ? "ml" : "en"))}
                className="shrink-0 whitespace-nowrap rounded-full border border-rinads-primary/15 bg-surface px-2.5 py-1 font-semibold text-rinads-primary"
                aria-label="Change RINPO voice language"
              >
                {voiceLang === "en" ? "EN" : "മലയാളം"}
              </button>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">Governed</span>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
            {history.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-rinads-primary/10 bg-surface-muted p-3.5">
                  <p className="text-sm font-semibold text-foreground">Operate {salonArea.toLowerCase()} by chat or voice.</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    RINPO uses this screen and store context. Reads run immediately; sensitive actions still follow permission, approval and audit rules.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickCommands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      disabled={isPending}
                      onClick={() => runCommand(command)}
                      className="min-h-11 rounded-xl border border-rinads-primary/15 bg-surface px-3 py-2 text-left text-[11px] font-semibold leading-4 text-foreground transition hover:bg-surface-muted disabled:opacity-50"
                    >
                      {command}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((entry, i) =>
                  entry.role === "user" ? (
                    <p key={i} className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-rinads-primary px-3 py-2 text-sm font-medium leading-5 text-white">
                      {entry.text}
                    </p>
                  ) : entry.kind === "clarify" ? (
                    <p key={i} className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface-muted px-3 py-2 text-sm leading-5 text-foreground">
                      {entry.question}
                    </p>
                  ) : (
                    <div key={i} className="max-w-[96%] space-y-2 rounded-2xl rounded-bl-md border border-rinads-primary/10 bg-surface-muted/70 p-3">
                      <p className="text-sm leading-5 text-foreground">{entry.summary}</p>
                      {entry.results.map((r, j) => (
                        <ResultCard key={j} result={r} canApprove={canApprove} />
                      ))}
                    </div>
                  )
                )}
                {isPending ? <p className="text-xs font-semibold text-rinads-primary">RINPO Runtime is working…</p> : null}
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-rinads-primary/10 bg-surface/95 p-3 backdrop-blur-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runCommand(text);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={startVoiceCommand}
                disabled={isPending || isListening}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-base font-semibold transition ${
                  isListening
                    ? "border-rinads-primary bg-rinads-primary text-white"
                    : "border-rinads-primary/20 bg-surface-muted text-rinads-primary"
                } disabled:opacity-50`}
                aria-label={isListening ? "Listening" : "Speak to RINPO"}
              >
                {isListening ? "●" : "🎙"}
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isListening ? "Listening…" : `Ask RINPO about ${salonArea.toLowerCase()}…`}
                className="h-11 min-w-0 flex-1 rounded-xl border border-rinads-primary/15 bg-surface-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              />
              <button
                type="submit"
                disabled={isPending || !text.trim()}
                className="btn-primary h-11 shrink-0 rounded-xl px-3.5"
                aria-label="Send to RINPO"
              >
                {isPending ? "…" : "Ask"}
              </button>
            </form>
            <p className="mt-2 hidden text-[10px] leading-4 text-muted-foreground sm:block">
              Voice and chat use the same tenancy, permission, approval and audit path.
            </p>
          </footer>
        </section>
      ) : (
        <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-[58] lg:bottom-6 lg:right-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-rinads-primary/20 bg-surface/95 shadow-[0_12px_32px_rgba(42,15,66,0.22)] backdrop-blur-xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 sm:h-16 sm:w-16"
            aria-label="Open RI SALON RINASPACE RINPO Phone"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_85%,rgba(159,75,199,0.18),transparent_62%)]" aria-hidden />
            <Image
              src="/assets/rinpo-face.png"
              alt="RINPO"
              fill
              sizes="64px"
              className="relative z-[1] object-contain p-1 transition-transform group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-1.5 right-1.5 z-[2] h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-surface" aria-hidden />
          </button>
          <p className="mt-1 hidden rounded-full border border-rinads-primary/10 bg-surface/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-rinads-primary shadow-sm backdrop-blur md:block">
            RINPO · {salonArea}
          </p>
        </div>
      )}
    </>
  );
}
