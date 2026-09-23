"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Mic } from "lucide-react";
import { RINPOOrb } from "@/components/system/RINPOOrb";
import { useRinpo } from "./RinpoProvider";
import { RINPO_STATE_LABELS } from "@/lib/rinpo-experience";

const EXPERIENCE_STEPS = ["Ask", "Understand", "Recommend", "Approve", "Act", "Audit"] as const;

export function RinpoConsole({ className = "" }: { className?: string }) {
  const {
    interactionState,
    pageContext,
    openPhoneScreen,
  } = useRinpo();
  const [input, setInput] = useState("");

  const submit = (prompt: string) => {
    const value = prompt.trim();
    if (!value) return;
    openPhoneScreen("chat", value);
    setInput("");
  };

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.16)] ${className}`}
      aria-label="RINPO console"
    >
      <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden border-b border-[var(--border)] bg-black p-6 text-white lg:border-b-0 lg:border-r">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(159,75,199,0.28), transparent 38%), radial-gradient(circle at 80% 75%, rgba(93,212,255,0.12), transparent 32%)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <RINPOOrb size="lg" priority />
              <div>
                <p className="text-sm font-semibold">RINPO</p>
                <p className="text-xs text-white/55">AI interface for RINADS</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rinads-primary">
                {pageContext.area}
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight">
                {pageContext.prompt}
              </h2>
            </div>
          </div>

          <div className="relative z-10 mt-10 flex items-center gap-2 text-xs text-white/55">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                interactionState === "failure" ? "bg-red-400" : "bg-emerald-400"
              }`}
              aria-hidden
            />
            <span>{RINPO_STATE_LABELS[interactionState]}</span>
          </div>
        </div>

        <div className="flex min-h-[360px] flex-col justify-between p-6 md:p-8">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Start with a question or outcome</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {pageContext.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition hover:border-rinads-primary/40 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2 rounded-2xl border border-rinads-primary/30 bg-[var(--surface-muted)] p-2 focus-within:ring-2 focus-within:ring-rinads-primary/40"
            >
              <label htmlFor="rinpo-console-input" className="sr-only">
                Ask RINPO
              </label>
              <input
                id="rinpo-console-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask RINPO anything about RINADS..."
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => openPhoneScreen("chat")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                aria-label="Open RINPO voice and chat"
              >
                <Mic size={18} aria-hidden />
              </button>
              <button
                type="submit"
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-rinads-primary px-4 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2"
              >
                Ask
                <ArrowRight size={16} aria-hidden />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] text-[var(--text-muted)]">
              {EXPERIENCE_STEPS.map((step, index) => (
                <span key={step} className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    {index === EXPERIENCE_STEPS.length - 1 ? (
                      <CheckCircle2 size={13} aria-hidden />
                    ) : null}
                    {step}
                  </span>
                  {index < EXPERIENCE_STEPS.length - 1 ? <span aria-hidden>→</span> : null}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              Executable actions are only enabled where the connected RINADS product supports the required permissions, approval rules, and audit path.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
