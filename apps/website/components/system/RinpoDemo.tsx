"use client";

import { CommandBar } from "@/components/system/CommandBar";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { HERO_COMMANDS } from "@/lib/product-ia";
import { trackMarketing } from "@/lib/analytics";

const ATTENTION_ITEMS = [
  { title: "7 leads", detail: "Need follow-up" },
  { title: "3 invoices", detail: "Overdue" },
  { title: "2 projects", detail: "Milestone risk" },
] as const;

type RinpoDemoProps = {
  variant?: "panel" | "compact";
  className?: string;
};

/**
 * Interactive / simulated RINPO surface for hero and homepage.
 * Always labels demo / synthetic data; recommendation ≠ execution.
 */
export function RinpoDemo({ variant = "panel", className = "" }: RinpoDemoProps) {
  const { openPhoneScreen } = useRinpo();

  return (
    <div className={`overflow-hidden rounded-3xl border border-white/15 bg-black/40 backdrop-blur ${className}`}>
      <div className="border-b border-white/10 px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINPO</p>
            <p className="mt-1 text-xs text-white/45">Demo workspace · Synthetic data</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
            Recommendation
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {variant === "panel" ? (
          <>
            <p className="text-sm text-white/45">YOU</p>
            <p className="mt-1 text-base font-semibold text-white sm:text-lg">
              &quot;What needs my attention today?&quot;
            </p>
            <div className="mt-5 rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.08] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO</p>
              <p className="mt-2 text-sm font-semibold text-white sm:text-base">Three areas need review today.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {ATTENTION_ITEMS.map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-white/50">{item.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-white/55 sm:text-sm">
                Recommendation does not equal execution permission. Supported actions route through the
                appropriate approvals.
              </p>
            </div>
          </>
        ) : null}

        <div className="mt-5">
          <CommandBar
            commands={HERO_COMMANDS}
            placeholder="Ask RINPO…"
            className="max-w-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            trackMarketing("rinpo_prompt_started", { source: "rinpo_demo" });
            openPhoneScreen("chat", "What needs my attention today?");
          }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-rinads-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
        >
          Open full RINPO chat
        </button>
      </div>
    </div>
  );
}
