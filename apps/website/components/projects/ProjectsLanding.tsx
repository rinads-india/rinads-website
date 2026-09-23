"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
} from "@/components/system";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import {
  BUDGET_RANGES,
  PROJECT_GOALS,
  TIMELINES,
  buildRinpoProjectPrompt,
  createEmptyProjectIntake,
  generateProjectBrief,
  getSuggestedNeeds,
  type ProjectGoal,
  type ProjectIntakeDraft,
} from "@/lib/project-intake";

type Step = "goal" | "details" | "brief" | "submitted";

const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-rinads-primary/60 focus:ring-2 focus:ring-rinads-primary/15";

export function ProjectsLanding() {
  const { openPhoneScreen } = useRinpo();
  const [step, setStep] = useState<Step>("goal");
  const [draft, setDraft] = useState<ProjectIntakeDraft>(createEmptyProjectIntake);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const brief = useMemo(() => generateProjectBrief(draft), [draft]);
  const suggestedNeeds = useMemo(() => getSuggestedNeeds(draft.goal), [draft.goal]);

  const update = <K extends keyof ProjectIntakeDraft>(
    key: K,
    value: ProjectIntakeDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const chooseGoal = (goal: ProjectGoal) => {
    setDraft((current) => ({
      ...current,
      goal,
      selectedNeeds:
        current.goal === goal ? current.selectedNeeds : getSuggestedNeeds(goal).slice(0, 2),
    }));
    setError("");
  };

  const toggleNeed = (need: string) => {
    setDraft((current) => ({
      ...current,
      selectedNeeds: current.selectedNeeds.includes(need)
        ? current.selectedNeeds.filter((item) => item !== need)
        : [...current.selectedNeeds, need],
    }));
  };

  const goToDetails = () => {
    if (!draft.goal) {
      setError("Choose the outcome that best matches the project.");
      return;
    }
    setStep("details");
    setError("");
  };

  const goToBrief = () => {
    if (!draft.name.trim()) return setError("Add your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      return setError("Add a valid email address.");
    }
    if (!draft.problem.trim()) return setError("Describe the current problem.");
    if (!draft.desiredOutcome.trim()) return setError("Describe the desired outcome.");
    setStep("brief");
    setError("");
  };

  const submitBrief = async () => {
    if (!consent) {
      setError("Confirm that RINADS may use these details to review and respond to the project request.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/project-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          brief,
          sourcePath: "/projects",
          consent,
          website,
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        submissionId?: string | null;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error || "We could not save the project brief.");
      }

      setSubmissionId(body.submissionId ?? null);
      setStep("submitted");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not save the project brief."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINADS Project Intake"
        headline="Turn the idea into a brief before anyone promises a solution."
        summary="Choose the outcome, answer a small set of operating questions, review a structured Project Brief, and submit it for human review. RINPO can help clarify the requirement, but pricing and delivery commitments are made only after review."
        primaryHref="#project-intake"
        primaryLabel="Build my project brief"
        secondaryHref="/services"
        secondaryLabel="Explore Services"
      />

      <section id="project-intake" className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <Progress step={step} />

          {step === "goal" ? (
            <GoalStep
              draft={draft}
              suggestedNeeds={suggestedNeeds}
              error={error}
              onGoal={chooseGoal}
              onToggleNeed={toggleNeed}
              onContinue={goToDetails}
              onAskRinpo={() =>
                openPhoneScreen(
                  "chat",
                  "Help me identify the right RINADS project goal. Ask me what outcome I need, then suggest the most relevant project category without inventing scope, price, or timeline."
                )
              }
            />
          ) : null}

          {step === "details" ? (
            <DetailsStep
              draft={draft}
              error={error}
              onUpdate={update}
              onBack={() => {
                setStep("goal");
                setError("");
              }}
              onContinue={goToBrief}
              onAskRinpo={() =>
                openPhoneScreen(
                  "chat",
                  buildRinpoProjectPrompt(draft)
                )
              }
            />
          ) : null}

          {step === "brief" ? (
            <BriefStep
              draft={draft}
              brief={brief}
              consent={consent}
              website={website}
              submitting={submitting}
              error={error}
              onConsent={setConsent}
              onWebsite={setWebsite}
              onBack={() => {
                setStep("details");
                setError("");
              }}
              onSubmit={submitBrief}
              onAskRinpo={() =>
                openPhoneScreen("chat", buildRinpoProjectPrompt(draft))
              }
            />
          ) : null}

          {step === "submitted" ? (
            <SubmittedState
              submissionId={submissionId}
              onNewBrief={() => {
                setDraft(createEmptyProjectIntake());
                setConsent(false);
                setWebsite("");
                setSubmissionId(null);
                setStep("goal");
              }}
            />
          ) : null}
        </div>
      </section>
    </MarketingPageShell>
  );
}

function Progress({ step }: { step: Step }) {
  const current = step === "goal" ? 0 : step === "details" ? 1 : step === "brief" ? 2 : 3;
  const items = ["Goal", "Requirements", "Project Brief", "Submitted"];

  return (
    <div className="mb-10 overflow-x-auto pb-2">
      <ol className="flex min-w-max items-center">
        {items.map((item, index) => (
          <li key={item} className="flex items-center">
            <div
              className={
                index <= current
                  ? "flex items-center gap-2 rounded-full border border-rinads-primary/35 bg-rinads-primary/[0.07] px-4 py-2 text-xs font-semibold text-rinads-primary"
                  : "flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]"
              }
            >
              {index < current ? <Check size={13} aria-hidden /> : <span>{index + 1}</span>}
              {item}
            </div>
            {index < items.length - 1 ? (
              <ArrowRight size={14} className="mx-2 text-[var(--text-muted)]" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function GoalStep({
  draft,
  suggestedNeeds,
  error,
  onGoal,
  onToggleNeed,
  onContinue,
  onAskRinpo,
}: {
  draft: ProjectIntakeDraft;
  suggestedNeeds: string[];
  error: string;
  onGoal: (goal: ProjectGoal) => void;
  onToggleNeed: (need: string) => void;
  onContinue: () => void;
  onAskRinpo: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.36fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
          Step 1 · Outcome
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          What needs to change?
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
          Start with the outcome rather than choosing technology too early.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {PROJECT_GOALS.map((goal) => {
            const active = draft.goal === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => onGoal(goal.id)}
                className={
                  active
                    ? "rounded-2xl border border-rinads-primary bg-rinads-primary/[0.07] p-5 text-left ring-2 ring-rinads-primary/10"
                    : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition hover:border-rinads-primary/45"
                }
              >
                <p className="font-bold text-[var(--text-primary)]">{goal.label}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{goal.description}</p>
              </button>
            );
          })}
        </div>

        {draft.goal ? (
          <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              Likely areas · editable
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedNeeds.map((need) => {
                const active = draft.selectedNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => onToggleNeed(need)}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-full bg-rinads-primary px-3 py-2 text-xs font-semibold text-white"
                        : "rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                    }
                  >
                    {need}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? <ErrorMessage message={error} /> : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            Continue to requirements
            <ArrowRight size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onAskRinpo}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/45"
          >
            <Bot size={16} className="text-rinads-primary" aria-hidden />
            Ask RINPO to help choose
          </button>
        </div>
      </div>

      <IntakePrinciples />
    </div>
  );
}

function DetailsStep({
  draft,
  error,
  onUpdate,
  onBack,
  onContinue,
  onAskRinpo,
}: {
  draft: ProjectIntakeDraft;
  error: string;
  onUpdate: <K extends keyof ProjectIntakeDraft>(
    key: K,
    value: ProjectIntakeDraft[K]
  ) => void;
  onBack: () => void;
  onContinue: () => void;
  onAskRinpo: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.36fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
          Step 2 · Requirements
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          Give RINADS enough context to understand the work.
        </h2>

        <div className="mt-8 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <input
                value={draft.name}
                onChange={(event) => onUpdate("name", event.target.value)}
                className={INPUT_CLASS}
                placeholder="Full name"
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                value={draft.email}
                onChange={(event) => onUpdate("email", event.target.value)}
                className={INPUT_CLASS}
                placeholder="name@company.com"
              />
            </Field>
            <Field label="Company">
              <input
                value={draft.company}
                onChange={(event) => onUpdate("company", event.target.value)}
                className={INPUT_CLASS}
                placeholder="Business / organization"
              />
            </Field>
            <Field label="Phone">
              <input
                value={draft.phone}
                onChange={(event) => onUpdate("phone", event.target.value)}
                className={INPUT_CLASS}
                placeholder="+91 ..."
              />
            </Field>
          </div>

          <Field label="Industry / business type">
            <input
              value={draft.industry}
              onChange={(event) => onUpdate("industry", event.target.value)}
              className={INPUT_CLASS}
              placeholder="e.g. retail, jewellery, salon, logistics, professional services"
            />
          </Field>

          <Field label="What is the current problem? *">
            <textarea
              rows={4}
              value={draft.problem}
              onChange={(event) => onUpdate("problem", event.target.value)}
              className={INPUT_CLASS}
              placeholder="Describe what is slow, fragmented, expensive, manual, confusing, or missing today."
            />
          </Field>

          <Field label="What outcome should this project create? *">
            <textarea
              rows={4}
              value={draft.desiredOutcome}
              onChange={(event) => onUpdate("desiredOutcome", event.target.value)}
              className={INPUT_CLASS}
              placeholder="Describe what should be measurably better after the project."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Who will use it?">
              <textarea
                rows={3}
                value={draft.users}
                onChange={(event) => onUpdate("users", event.target.value)}
                className={INPUT_CLASS}
                placeholder="Customers, owners, staff, sales team, operations..."
              />
            </Field>
            <Field label="Current tools / systems">
              <textarea
                rows={3}
                value={draft.currentTools}
                onChange={(event) => onUpdate("currentTools", event.target.value)}
                className={INPUT_CLASS}
                placeholder="Spreadsheets, existing ERP, website, WhatsApp, CRM..."
              />
            </Field>
          </div>

          <Field label="Must-haves / constraints">
            <textarea
              rows={3}
              value={draft.mustHaves}
              onChange={(event) => onUpdate("mustHaves", event.target.value)}
              className={INPUT_CLASS}
              placeholder="Integrations, approvals, data migration, languages, devices, compliance, brand constraints..."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget range">
              <select
                value={draft.budgetRange}
                onChange={(event) => onUpdate("budgetRange", event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Choose a range</option>
                {BUDGET_RANGES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Desired timeline">
              <select
                value={draft.timeline}
                onChange={(event) => onUpdate("timeline", event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Choose a timeline</option>
                {TIMELINES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {error ? <ErrorMessage message={error} /> : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            <ArrowLeft size={15} aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            Generate Project Brief
            <FileText size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onAskRinpo}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-rinads-primary"
          >
            <Bot size={16} aria-hidden />
            Ask RINPO what is missing
          </button>
        </div>
      </div>

      <IntakePrinciples />
    </div>
  );
}

function BriefStep({
  draft,
  brief,
  consent,
  website,
  submitting,
  error,
  onConsent,
  onWebsite,
  onBack,
  onSubmit,
  onAskRinpo,
}: {
  draft: ProjectIntakeDraft;
  brief: ReturnType<typeof generateProjectBrief>;
  consent: boolean;
  website: string;
  submitting: boolean;
  error: string;
  onConsent: (value: boolean) => void;
  onWebsite: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onAskRinpo: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.38fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
          Step 3 · Project Brief
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          Review the brief before it reaches the team.
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
          This brief is generated deterministically from what you entered. It is not an automatic quote, contract, technical specification, or delivery commitment.
        </p>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] bg-black p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">
              RINPO Project Brief
            </p>
            <h3 className="mt-3 text-2xl font-bold">{brief.title}</h3>
            <p className="mt-2 text-sm text-white/50">
              Prepared from the project intake · review required
            </p>
          </div>

          <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
            <BriefCell label="Goal" value={brief.goalLabel} />
            <BriefCell label="Business" value={draft.company || "Not specified"} />
            <BriefCell label="Industry" value={draft.industry || "Not specified"} />
            <BriefCell label="Users" value={brief.users} />
            <BriefCell label="Budget" value={brief.budgetRange} />
            <BriefCell label="Timeline" value={brief.timeline} />
          </div>

          <div className="space-y-6 p-6">
            <BriefBlock label="Current problem" text={brief.problem} />
            <BriefBlock label="Desired outcome" text={brief.desiredOutcome} />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Likely scope
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brief.scope.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-rinads-primary/25 bg-rinads-primary/[0.05] px-3 py-1.5 text-xs font-semibold text-rinads-primary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <BriefBlock label="Current tools" text={brief.currentTools} />

            {brief.constraints.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Context / constraints
                </p>
                <ul className="mt-3 space-y-2">
                  {brief.constraints.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--text-secondary)]">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-rinads-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
                What happens next
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{brief.nextStep}</p>
            </div>
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => onConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--rinads-primary)]"
          />
          <span className="text-sm leading-6 text-[var(--text-muted)]">
            I agree that RINADS may store these project details and contact information to review and respond to this request. No purchase, price, scope, or delivery commitment is created by submitting this brief.
          </span>
        </label>

        <div className="hidden" aria-hidden>
          <label htmlFor="project-website">Website</label>
          <input
            id="project-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => onWebsite(event.target.value)}
          />
        </div>

        {error ? <ErrorMessage message={error} /> : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-50"
          >
            <ArrowLeft size={15} aria-hidden />
            Edit requirements
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit for human review"}
            <ArrowRight size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onAskRinpo}
            disabled={submitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-rinads-primary disabled:opacity-50"
          >
            <Bot size={16} aria-hidden />
            Review with RINPO
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <IntakePrinciples />
        <div className="rounded-3xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-rinads-primary" aria-hidden />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Human review gate</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Submission creates an intake record for RINADS review. It does not automatically create a paid order, project, invoice, deployment, or delivery date.
          </p>
        </div>
      </div>
    </div>
  );
}

function SubmittedState({
  submissionId,
  onNewBrief,
}: {
  submissionId: string | null;
  onNewBrief: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center md:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
        <CheckCircle2 size={26} aria-hidden />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
        Project Brief Submitted
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
        The request is ready for human review.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
        RINADS now has the project context you submitted. The team can validate requirements before discussing scope, commercial terms, schedule, or delivery.
      </p>
      {submissionId ? (
        <p className="mt-5 font-mono text-xs text-[var(--text-muted)]">
          Intake reference: {submissionId.slice(0, 8).toUpperCase()}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onNewBrief}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          Create another brief
        </button>
        <a
          href="mailto:hello@rinads.com"
          className="rounded-full bg-rinads-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
        >
          Email RINADS
        </a>
      </div>
    </div>
  );
}

function IntakePrinciples() {
  return (
    <aside className="rounded-3xl border border-[var(--border)] bg-black p-5 text-white lg:sticky lg:top-28">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-rinads-primary" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
          Intake rules
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {[
          ["Outcome first", "Define what should change before choosing technology."],
          ["RINPO assists", "RINPO can clarify questions and missing requirements."],
          ["No fake quote", "The brief does not invent price, scope, or delivery dates."],
          ["Human review", "A person validates the brief before a commercial commitment."],
        ].map(([title, detail]) => (
          <div key={title} className="flex gap-3">
            <ClipboardList size={17} className="mt-0.5 shrink-0 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
      {children}
    </label>
  );
}

function BriefCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function BriefBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
        {text || "To be clarified"}
      </p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-5 rounded-2xl border border-[var(--status-critical-fg)]/20 bg-[var(--status-critical-bg)] p-4 text-sm text-[var(--status-critical-fg)]"
    >
      {message}
    </p>
  );
}
