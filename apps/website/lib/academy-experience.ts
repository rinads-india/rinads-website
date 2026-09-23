export type AcademyExperienceKey =
  | "university"
  | "programs"
  | "live"
  | "ai"
  | "filmmaking"
  | "founder"
  | "software"
  | "marketing"
  | "creator";

export type AcademyExperienceConfig = {
  slug: AcademyExperienceKey;
  practice: string;
  work: string;
  ship: string;
  measure: string;
  rinpoPrompt: string;
};

export const ACADEMY_EXPERIENCES: Record<AcademyExperienceKey, AcademyExperienceConfig> = {
  university: {
    slug: "university",
    practice: "Use structured exercises to build operating skill across the RINADS platform.",
    work: "Apply learning to real business problems rather than isolated lesson completion.",
    ship: "Produce portfolio evidence, operating artifacts, or implemented workflows.",
    measure: "Track progress through skill evidence, project quality, and application.",
    rinpoPrompt: "Show me how RINADS University turns learning into practical work and shipped outcomes.",
  },
  programs: {
    slug: "programs",
    practice: "Follow a structured path with exercises tied to the target role or capability.",
    work: "Use assignments that resemble the work expected in the real environment.",
    ship: "Complete milestone projects instead of ending at lesson completion.",
    measure: "Review progress against program outcomes and shipped evidence.",
    rinpoPrompt: "Help me choose the RINADS Academy program that fits the skill or role I want to build.",
  },
  live: {
    slug: "live",
    practice: "Use instructor-led sessions for guided practice, critique, and iteration.",
    work: "Bring active business or project problems into the learning loop where appropriate.",
    ship: "Turn live-session work into completed assignments or project outputs.",
    measure: "Use feedback and completed work to determine the next learning step.",
    rinpoPrompt: "Explain how live learning works inside RINADS Academy.",
  },
  ai: {
    slug: "ai",
    practice: "Practice prompting, workflow design, evaluation, and tool-connected AI use.",
    work: "Apply AI to concrete business tasks with context and guardrails.",
    ship: "Build a working assistant, workflow, or AI-enabled business use case.",
    measure: "Evaluate usefulness, reliability, cost, and business impact rather than novelty.",
    rinpoPrompt: "Help me plan an AI learning path from fundamentals to a real business application.",
  },
  filmmaking: {
    slug: "filmmaking",
    practice: "Develop story, script, visual direction, voice, and generation workflows.",
    work: "Operate through a production pipeline with review gates and asset consistency.",
    ship: "Complete a finished AI film, reel, or production case for the portfolio.",
    measure: "Review story clarity, visual consistency, production quality, and delivery discipline.",
    rinpoPrompt: "Show me how the AI Filmmaking program moves from story to a finished production.",
  },
  founder: {
    slug: "founder",
    practice: "Practice operating cadence, decision-making, customer, money, growth, and team systems.",
    work: "Apply the frameworks directly to an active company or founder project.",
    ship: "Produce operating dashboards, plans, workflows, and measurable business changes.",
    measure: "Review operating rhythm, execution quality, and business outcomes.",
    rinpoPrompt: "Help me map the Founder School path to the operating problems in my business.",
  },
  software: {
    slug: "software",
    practice: "Practice requirements, UX, architecture, implementation, testing, and deployment.",
    work: "Build against real product constraints including data, permissions, failure states, and maintainability.",
    ship: "Deploy a working software product or meaningful production-grade project.",
    measure: "Assess code quality, architecture, test coverage, delivery, and user outcome.",
    rinpoPrompt: "Help me plan a Software School path that ends with a shipped product.",
  },
  marketing: {
    slug: "marketing",
    practice: "Practice research, positioning, content, campaign setup, channel execution, and analysis.",
    work: "Operate on real or realistic growth briefs with lead and customer context.",
    ship: "Launch a measurable campaign, content system, or growth project.",
    measure: "Review channel performance, lead quality, follow-up, and business outcome.",
    rinpoPrompt: "Help me plan a Marketing School path built around real campaign work.",
  },
  creator: {
    slug: "creator",
    practice: "Practice positioning, storytelling, content systems, production, and distribution.",
    work: "Build a repeatable creator workflow around an actual niche, audience, or business.",
    ship: "Publish a coherent portfolio or content system rather than isolated exercises.",
    measure: "Review consistency, audience response, production quality, and repeatability.",
    rinpoPrompt: "Help me build a Creator School path around a real content and brand system.",
  },
};

export function getAcademyExperience(slug: string): AcademyExperienceConfig | null {
  if (slug in ACADEMY_EXPERIENCES) {
    return ACADEMY_EXPERIENCES[slug as AcademyExperienceKey];
  }
  return null;
}
