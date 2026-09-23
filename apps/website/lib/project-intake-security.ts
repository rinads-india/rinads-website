import { createRateLimiter } from "@/lib/chat-security";
import {
  PROJECT_GOALS,
  type ProjectBrief,
  type ProjectGoal,
} from "@/lib/project-intake";

export const PROJECT_INTAKE_RATE_LIMIT_WINDOW_MS = 60_000;
export const PROJECT_INTAKE_RATE_LIMIT_MAX = 6;
export const PROJECT_INTAKE_MAX_BODY_BYTES = 24_000;

const GOALS = new Set(PROJECT_GOALS.map((item) => item.id));

export type ProjectIntakeSubmission = {
  goal: ProjectGoal;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  industry: string | null;
  problem: string;
  desiredOutcome: string;
  users: string | null;
  currentTools: string | null;
  mustHaves: string | null;
  budgetRange: string | null;
  timeline: string | null;
  selectedNeeds: string[];
  brief: ProjectBrief;
  sourcePath: string;
  consent: true;
  website?: string;
};

type ValidationError = {
  status: 400;
  error: string;
};

function stringValue(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > max) return null;
  return normalized;
}

function optionalString(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return stringValue(value, max);
}

export function validateProjectIntakeSubmission(
  input: unknown
): ProjectIntakeSubmission | ValidationError {
  if (!input || typeof input !== "object") {
    return { status: 400, error: "Invalid request" };
  }

  const body = input as Record<string, unknown>;
  const goal = typeof body.goal === "string" && GOALS.has(body.goal as ProjectGoal)
    ? (body.goal as ProjectGoal)
    : null;
  const name = stringValue(body.name, 120);
  const email = stringValue(body.email, 254)?.toLowerCase() ?? null;
  const problem = stringValue(body.problem, 2500);
  const desiredOutcome = stringValue(body.desiredOutcome, 2500);
  const sourcePath = optionalString(body.sourcePath, 200) ?? "/projects";

  if (!goal) return { status: 400, error: "Choose a project goal" };
  if (!name) return { status: 400, error: "Name is required" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 400, error: "A valid email is required" };
  }
  if (!problem) return { status: 400, error: "Describe the current problem" };
  if (!desiredOutcome) return { status: 400, error: "Describe the desired outcome" };
  if (body.consent !== true) {
    return { status: 400, error: "Consent is required before submission" };
  }

  const selectedNeeds = Array.isArray(body.selectedNeeds)
    ? body.selectedNeeds
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((item) => item.slice(0, 100))
    : [];

  const brief = body.brief;
  if (!brief || typeof brief !== "object") {
    return { status: 400, error: "Project brief is required" };
  }

  const parsedBrief = brief as ProjectBrief;
  if (
    typeof parsedBrief.title !== "string" ||
    typeof parsedBrief.goalLabel !== "string" ||
    typeof parsedBrief.problem !== "string" ||
    typeof parsedBrief.desiredOutcome !== "string" ||
    !Array.isArray(parsedBrief.scope) ||
    typeof parsedBrief.nextStep !== "string"
  ) {
    return { status: 400, error: "Invalid project brief" };
  }

  return {
    goal,
    name,
    email,
    company: optionalString(body.company, 160),
    phone: optionalString(body.phone, 40),
    industry: optionalString(body.industry, 120),
    problem,
    desiredOutcome,
    users: optionalString(body.users, 1000),
    currentTools: optionalString(body.currentTools, 1500),
    mustHaves: optionalString(body.mustHaves, 1500),
    budgetRange: optionalString(body.budgetRange, 80),
    timeline: optionalString(body.timeline, 80),
    selectedNeeds,
    brief: {
      title: parsedBrief.title.slice(0, 240),
      goalLabel: parsedBrief.goalLabel.slice(0, 160),
      problem: parsedBrief.problem.slice(0, 2500),
      desiredOutcome: parsedBrief.desiredOutcome.slice(0, 2500),
      scope: parsedBrief.scope
        .filter((item): item is string => typeof item === "string")
        .slice(0, 20)
        .map((item) => item.slice(0, 120)),
      users: typeof parsedBrief.users === "string" ? parsedBrief.users.slice(0, 1000) : "To be clarified",
      currentTools:
        typeof parsedBrief.currentTools === "string"
          ? parsedBrief.currentTools.slice(0, 1500)
          : "To be clarified",
      constraints: Array.isArray(parsedBrief.constraints)
        ? parsedBrief.constraints
            .filter((item): item is string => typeof item === "string")
            .slice(0, 20)
            .map((item) => item.slice(0, 180))
        : [],
      budgetRange:
        typeof parsedBrief.budgetRange === "string"
          ? parsedBrief.budgetRange.slice(0, 80)
          : "Not decided yet",
      timeline:
        typeof parsedBrief.timeline === "string"
          ? parsedBrief.timeline.slice(0, 80)
          : "Exploring / no fixed date",
      nextStep: parsedBrief.nextStep.slice(0, 600),
    },
    sourcePath,
    consent: true,
    website: typeof body.website === "string" ? body.website.slice(0, 200) : undefined,
  };
}

export const projectIntakeRateLimiter = createRateLimiter(
  PROJECT_INTAKE_RATE_LIMIT_WINDOW_MS,
  PROJECT_INTAKE_RATE_LIMIT_MAX
);
