"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  cloneElement,
  isValidElement,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  COMPANY_SIZES,
  PROJECT_OUTCOMES,
  TIMELINES,
  type LeadPayload,
} from "@/lib/content/leads";
import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
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
  phone: string;
  company: string;
  role: string;
  companySize: string;
  industry: string;
  currentTools: string;
  problem: string;
  timeline: string;
  budget: string;
  message: string;
  websiteUrl: string;
  privacyAccepted: boolean;
  website: string; // honeypot
};

const INITIAL: FormState = {
  outcome: "",
  name: "",
  workEmail: "",
  phone: "",
  company: "",
  role: "",
  companySize: "",
  industry: "",
  currentTools: "",
  problem: "",
  timeline: "",
  budget: "",
  message: "",
  websiteUrl: "",
  privacyAccepted: false,
  website: "",
};

const fieldClass =
  "mt-1.5 w-full min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

export function LeadForm({
  defaultIntent,
  defaultPlan,
  sourcePath = "/contact",
  heading = "Tell us what you need",
  compact = false,
}: LeadFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [leadId, setLeadId] = useState<string | undefined>();

  const businessEmail = COMPANY_CONFIG.contact.businessEmail;
  const whatsappUrl = COMPANY_CONFIG.contact.whatsappUrl;

  useEffect(() => {
    if (!started) return;
    trackMarketing("contact_form_started", { sourcePath, intent: defaultIntent });
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

  function focusFirstError(nextErrors: Record<string, string>) {
    const firstField = Object.keys(nextErrors)[0];
    if (!firstField || !formRef.current) return;
    const el =
      formRef.current.querySelector<HTMLElement>(`[name="${firstField}"]`) ??
      formRef.current.querySelector<HTMLElement>(`#${CSS.escape(`${formId}-${firstField}`)}`);
    el?.focus();
  }

  function buildPayload(stage: "step1" | "complete"): Partial<LeadPayload> {
    return {
      ...form,
      intent: defaultIntent,
      plan: defaultPlan,
      sourcePath,
      honeypot: form.website,
      stage,
    };
  }

  async function submitPayload(stage: "step1" | "complete") {
    setStatus("submitting");
    setServerMessage("");
    const payload = buildPayload(stage);

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
        stored?: boolean;
        id?: string;
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
        queueMicrotask(() => focusFirstError(nextErrors));
        return false;
      }

      if (data.id) setLeadId(data.id);
      setStatus("idle");
      setServerMessage(data.message ?? "");
      return true;
    } catch {
      setStatus("error");
      setServerMessage("We could not submit your enquiry right now. Please try again.");
      return false;
    }
  }

  async function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submitPayload("step1");
    if (!ok) return;
    trackMarketing("contact_step1_completed", {
      sourcePath,
      intent: defaultIntent,
      outcome: form.outcome,
    });
    setStep(2);
  }

  async function onComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submitPayload("complete");
    if (!ok) return;
    trackMarketing("contact_step2_completed", {
      sourcePath,
      intent: defaultIntent,
      plan: defaultPlan,
    });
    trackMarketing("lead_submitted", {
      sourcePath,
      intent: defaultIntent,
      plan: defaultPlan,
      outcome: form.outcome,
    });
    if (defaultIntent === "demo") {
      trackMarketing("demo_booking_completed", { sourcePath, intent: defaultIntent, plan: defaultPlan });
    }
    setStatus("success");
    setForm(INITIAL);
    setStep(1);
  }

  if (status === "success") {
    return (
      <div
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
        role="status"
        aria-live="polite"
      >
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Enquiry received</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {serverMessage || "Thanks — our team will follow up."}
        </p>
        <ContactFallbacks businessEmail={businessEmail} whatsappUrl={whatsappUrl} />
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-rinads-primary hover:underline"
          onClick={() => {
            setStatus("idle");
            setServerMessage("");
            setLeadId(undefined);
          }}
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <div>
      <form
        ref={formRef}
        onSubmit={step === 1 ? onContinue : onComplete}
        noValidate
        className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${compact ? "p-5" : "p-6 md:p-8"}`}
        aria-labelledby={`${formId}-heading`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${formId}-heading`} className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
            {heading}
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]" aria-live="polite">
            Step {step} of 2
          </p>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {step === 1
            ? "A few required details — we create your lead after this step."
            : "Optional context helps us prepare a better conversation. Skip anything you prefer not to share."}
        </p>

        {step === 1 ? (
          <>
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-[var(--text-primary)]">Primary problem</legend>
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
              <Field id={`${formId}-name`} label="Name" error={errors.name} required>
                <input
                  id={`${formId}-name`}
                  name="name"
                  autoComplete="name"
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>
              <Field id={`${formId}-email`} label="Work email" error={errors.workEmail} required={!form.phone}>
                <input
                  id={`${formId}-email`}
                  name="workEmail"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className={fieldClass}
                  value={form.workEmail}
                  onChange={(e) => update("workEmail", e.target.value)}
                />
              </Field>
              <Field id={`${formId}-phone`} label="Phone (or email above)" error={errors.phone} required={!form.workEmail}>
                <input
                  id={`${formId}-phone`}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  className={fieldClass}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
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
              <Field id={`${formId}-role`} label="Role" error={errors.role} required className="sm:col-span-2">
                <input
                  id={`${formId}-role`}
                  name="role"
                  autoComplete="organization-title"
                  className={fieldClass}
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                />
              </Field>
            </div>

            {form.outcome === "other" ? (
              <Field id={`${formId}-problem`} label="Tell us more" error={errors.problem} className="mt-4">
                <textarea
                  id={`${formId}-problem`}
                  name="problem"
                  rows={3}
                  className={fieldClass}
                  value={form.problem}
                  onChange={(e) => update("problem", e.target.value)}
                />
              </Field>
            ) : null}

            <label className="mt-5 flex items-start gap-3 text-sm text-[var(--text-muted)]">
              <input
                type="checkbox"
                name="privacyAccepted"
                className="mt-1 h-4 w-4 min-h-4 min-w-4 rounded border-[var(--border)]"
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
          </>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field id={`${formId}-industry`} label="Industry" error={errors.industry}>
              <input
                id={`${formId}-industry`}
                name="industry"
                className={fieldClass}
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
              />
            </Field>
            <Field id={`${formId}-size`} label="Team size" error={errors.companySize}>
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
            <Field id={`${formId}-tools`} label="Current tools" error={errors.currentTools}>
              <input
                id={`${formId}-tools`}
                name="currentTools"
                className={fieldClass}
                value={form.currentTools}
                onChange={(e) => update("currentTools", e.target.value)}
                placeholder="CRM, commerce, spreadsheets…"
              />
            </Field>
            <Field id={`${formId}-timeline`} label="Timeline" error={errors.timeline}>
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
            <Field id={`${formId}-website-url`} label="Website" error={errors.websiteUrl}>
              <input
                id={`${formId}-website-url`}
                name="websiteUrl"
                type="url"
                inputMode="url"
                autoComplete="url"
                className={fieldClass}
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field id={`${formId}-budget`} label="Budget range" error={errors.budget}>
              <input
                id={`${formId}-budget`}
                name="budget"
                className={fieldClass}
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </Field>
            <Field id={`${formId}-message`} label="Additional context" error={errors.message} className="sm:col-span-2">
              <textarea
                id={`${formId}-message`}
                name="message"
                rows={3}
                className={fieldClass}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
              />
            </Field>
            {leadId ? (
              <p className="sm:col-span-2 text-xs text-[var(--text-muted)]">Lead reference saved from step 1.</p>
            ) : null}
          </div>
        )}

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

        {status === "error" || errorSummary.length ? (
          <div
            className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
            role="alert"
            aria-live="assertive"
          >
            {serverMessage || "Please correct the errors above."}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {step === 2 ? (
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {status === "submitting"
              ? "Sending…"
              : step === 1
                ? "Continue"
                : defaultIntent === "demo"
                  ? "Book a demo"
                  : "Submit enquiry"}
          </button>
          {step === 2 ? (
            <button
              type="button"
              className="text-sm font-semibold text-rinads-primary hover:underline"
              disabled={status === "submitting"}
              onClick={async () => {
                const ok = await submitPayload("complete");
                if (!ok) return;
                trackMarketing("contact_step2_completed", { sourcePath, intent: defaultIntent, skipped: true });
                trackMarketing("lead_submitted", { sourcePath, intent: defaultIntent, outcome: form.outcome });
                setStatus("success");
                setForm(INITIAL);
                setStep(1);
              }}
            >
              Skip and finish
            </button>
          ) : null}
        </div>
      </form>

      <ContactFallbacks businessEmail={businessEmail} whatsappUrl={whatsappUrl} />
    </div>
  );
}

function ContactFallbacks({
  businessEmail,
  whatsappUrl,
}: {
  businessEmail?: string;
  whatsappUrl?: string;
}) {
  if (!businessEmail && !whatsappUrl) return null;
  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">
      <p className="font-semibold text-[var(--text-primary)]">Prefer another route?</p>
      <ul className="mt-2 space-y-1">
        {businessEmail ? (
          <li>
            Business email:{" "}
            <a className="text-rinads-primary hover:underline" href={`mailto:${businessEmail}`}>
              {businessEmail}
            </a>
          </li>
        ) : null}
        {whatsappUrl ? (
          <li>
            <a
              className="text-rinads-primary hover:underline"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackMarketing("whatsapp_clicked", { source: "lead_form" })}
            >
              WhatsApp / contact route
            </a>
          </li>
        ) : null}
      </ul>
    </div>
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
  const describedBy = error ? `${id}-error` : undefined;
  const control = (() => {
    if (!isValidElement(children)) return children;
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      id,
      "aria-invalid": error ? true : undefined,
      "aria-required": required || undefined,
      "aria-describedby": describedBy ?? (childProps["aria-describedby"] as string | undefined),
    });
  })();

  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
        {required ? <span className="text-rinads-primary"> *</span> : null}
      </label>
      {control}
      {error ? (
        <p className="mt-1.5 text-sm text-red-400" role="alert" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
