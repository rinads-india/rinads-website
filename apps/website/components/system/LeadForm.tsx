"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  COMPANY_SIZES,
  PROJECT_OUTCOMES,
  TIMELINES,
  type LeadPayload,
} from "@/lib/content/leads";
import { trackMarketing } from "@/lib/analytics";

type LeadFormProps = {
  defaultIntent?: string;
  defaultPlan?: string;
  sourcePath?: string;
  heading?: string;
  compact?: boolean;
};

type FormState = {
  outcome: string;
  name: string;
  workEmail: string;
  company: string;
  role: string;
  companySize: string;
  industry: string;
  currentTools: string;
  problem: string;
  timeline: string;
  budget: string;
  message: string;
  privacyAccepted: boolean;
  website: string; // honeypot
};

const INITIAL: FormState = {
  outcome: "",
  name: "",
  workEmail: "",
  company: "",
  role: "",
  companySize: "",
  industry: "",
  currentTools: "",
  problem: "",
  timeline: "",
  budget: "",
  message: "",
  privacyAccepted: false,
  website: "",
};

const fieldClass =
  "mt-1.5 w-full min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

export function LeadForm({
  defaultIntent,
  defaultPlan,
  sourcePath = "/contact",
  heading = "What are you trying to achieve?",
  compact = false,
}: LeadFormProps) {
  const formId = useId();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    trackMarketing("project_form_started", { sourcePath, intent: defaultIntent });
  }, [started, sourcePath, defaultIntent]);

  const errorSummary = useMemo(() => Object.values(errors), [errors]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (!started) setStarted(true);
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setServerMessage("");

    const payload: Partial<LeadPayload> = {
      ...form,
      intent: defaultIntent,
      plan: defaultPlan,
      sourcePath,
      honeypot: form.website,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        errors?: { field: string; message: string }[];
      };

      if (!res.ok || !data.ok) {
        const nextErrors: Record<string, string> = {};
        for (const err of data.errors ?? []) {
          nextErrors[err.field] = err.message;
        }
        setErrors(nextErrors);
        setStatus("error");
        setServerMessage(data.error ?? "Please fix the highlighted fields.");
        return;
      }

      setStatus("success");
      setServerMessage(data.message ?? "Thanks — your enquiry was received.");
      trackMarketing(
        defaultIntent === "demo" ? "demo_booking_completed" : "project_form_completed",
        { sourcePath, intent: defaultIntent, plan: defaultPlan },
      );
      setForm(INITIAL);
    } catch {
      setStatus("error");
      setServerMessage("We could not submit your enquiry right now. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
        role="status"
        aria-live="polite"
      >
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Enquiry received</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{serverMessage}</p>
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-rinads-primary hover:underline"
          onClick={() => {
            setStatus("idle");
            setServerMessage("");
          }}
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${compact ? "p-5" : "p-6 md:p-8"}`}
      aria-labelledby={`${formId}-heading`}
    >
      <h2 id={`${formId}-heading`} className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Visible labels, server-side validation, and privacy acknowledgement are required. Never include passwords or API keys.
      </p>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-[var(--text-primary)]">What are you trying to achieve?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PROJECT_OUTCOMES.map((outcome) => {
            const selected = form.outcome === outcome.id;
            return (
              <label
                key={outcome.id}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  selected
                    ? "border-rinads-primary bg-rinads-primary/10"
                    : "border-[var(--border)] hover:border-rinads-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value={outcome.id}
                  checked={selected}
                  onChange={() => update("outcome", outcome.id)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{outcome.label}</span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">{outcome.description}</span>
              </label>
            );
          })}
        </div>
        {errors.outcome ? (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {errors.outcome}
          </p>
        ) : null}
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          id={`${formId}-name`}
          label="Name"
          error={errors.name}
          required
        >
          <input
            id={`${formId}-name`}
            name="name"
            autoComplete="name"
            className={fieldClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field id={`${formId}-email`} label="Work email" error={errors.workEmail} required>
          <input
            id={`${formId}-email`}
            name="workEmail"
            type="email"
            autoComplete="email"
            className={fieldClass}
            value={form.workEmail}
            onChange={(e) => update("workEmail", e.target.value)}
          />
        </Field>
        <Field id={`${formId}-company`} label="Company" error={errors.company} required>
          <input
            id={`${formId}-company`}
            name="company"
            autoComplete="organization"
            className={fieldClass}
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </Field>
        <Field id={`${formId}-role`} label="Role" error={errors.role} required>
          <input
            id={`${formId}-role`}
            name="role"
            autoComplete="organization-title"
            className={fieldClass}
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          />
        </Field>
        <Field id={`${formId}-size`} label="Company / team size" error={errors.companySize} required>
          <select
            id={`${formId}-size`}
            name="companySize"
            className={fieldClass}
            value={form.companySize}
            onChange={(e) => update("companySize", e.target.value)}
          >
            <option value="">Select size</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${formId}-industry`} label="Industry" error={errors.industry} required>
          <input
            id={`${formId}-industry`}
            name="industry"
            className={fieldClass}
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
          />
        </Field>
        <Field id={`${formId}-tools`} label="Current tools (optional)" error={errors.currentTools}>
          <input
            id={`${formId}-tools`}
            name="currentTools"
            className={fieldClass}
            value={form.currentTools}
            onChange={(e) => update("currentTools", e.target.value)}
            placeholder="CRM, commerce, spreadsheets…"
          />
        </Field>
        <Field id={`${formId}-timeline`} label="Timeline" error={errors.timeline} required>
          <select
            id={`${formId}-timeline`}
            name="timeline"
            className={fieldClass}
            value={form.timeline}
            onChange={(e) => update("timeline", e.target.value)}
          >
            <option value="">Select timeline</option>
            {TIMELINES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id={`${formId}-problem`} label="Problem" error={errors.problem} required className="mt-4">
        <textarea
          id={`${formId}-problem`}
          name="problem"
          rows={4}
          className={fieldClass}
          value={form.problem}
          onChange={(e) => update("problem", e.target.value)}
        />
      </Field>

      <Field id={`${formId}-budget`} label="Optional budget" error={errors.budget} className="mt-4">
        <input
          id={`${formId}-budget`}
          name="budget"
          className={fieldClass}
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
        />
      </Field>

      <Field id={`${formId}-message`} label="Message (optional)" error={errors.message} className="mt-4">
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={3}
          className={fieldClass}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </Field>

      {/* Honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-[var(--text-muted)]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-[var(--border)]"
          checked={form.privacyAccepted}
          onChange={(e) => update("privacyAccepted", e.target.checked)}
        />
        <span>
          I agree that RINADS may use this information to respond to my enquiry, as described in the{" "}
          <Link href="/company/privacy" className="text-rinads-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {errors.privacyAccepted ? (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {errors.privacyAccepted}
        </p>
      ) : null}

      {status === "error" || errorSummary.length ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert" aria-live="assertive">
          {serverMessage || "Please correct the errors above."}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
      >
        {status === "submitting" ? "Sending…" : defaultIntent === "demo" ? "Book a platform demo" : "Submit enquiry"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
  className = "",
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
        {required ? <span className="text-rinads-primary"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-400" role="alert" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
