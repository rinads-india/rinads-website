import type { AcademyProgram } from "./types";

export const ACADEMY_MODEL = [
  "LEARN",
  "PRACTICE",
  "WORK",
  "SHIP",
  "MEASURE",
  "IMPROVE",
  "CERTIFY",
] as const;

export const ACADEMY_SUPPORT = [
  "Online",
  "Offline",
  "Hybrid",
  "Live classes",
  "Assignments",
  "Projects",
  "Real business work",
  "Skill graph",
  "Portfolio",
  "Certification",
  "RINPO tutor",
] as const;

export const ACADEMY_PROGRAMS: AcademyProgram[] = [
  {
    slug: "university",
    name: "RINADS University",
    headline: "The Real Experience Academy.",
    summary:
      "A full learning system inside RINADS — not content libraries, but practice, work, shipping, and certification.",
    outcomes: ["Skill graph progress", "Portfolio projects", "Certification paths", "RINPO tutoring"],
    format: ["Online", "Offline", "Hybrid", "Live"],
  },
  {
    slug: "programs",
    name: "Programs",
    headline: "Structured paths across the platform.",
    summary: "Curated programs spanning founder, AI, software, marketing, creator, and operations schools.",
    outcomes: ["Clear curriculum", "Project milestones", "Mentor + RINPO support"],
    format: ["Online", "Hybrid", "Live"],
  },
  {
    slug: "live",
    name: "Live Classes",
    headline: "Live sessions that lead to shipped work.",
    summary: "Instructor-led classes with assignments, peer practice, and real business outcomes.",
    outcomes: ["Live instruction", "Assignments", "Peer review"],
    format: ["Live", "Online", "Hybrid"],
  },
  {
    slug: "ai",
    name: "AI School",
    headline: "Train people to operate with intelligence.",
    summary: "From AI literacy to agentic workflows — learn how RINPO and RINADS Intelligence change work.",
    outcomes: ["AI literacy", "Prompt systems", "Agent workflows", "Business application"],
    format: ["Online", "Live", "Hybrid"],
  },
  {
    slug: "filmmaking",
    name: "AI Filmmaking",
    headline: "Create films with Creative OS.",
    summary: "Story, script, voice, music, and AI film production — learn by shipping real creative work.",
    outcomes: ["Story craft", "AI film pipeline", "Portfolio reels"],
    format: ["Online", "Offline", "Live"],
  },
  {
    slug: "founder",
    name: "Founder School",
    headline: "Build and run companies on RINADS.",
    summary: "Operating systems for founders — customers, money, growth, product, and people.",
    outcomes: ["Operating cadence", "Growth systems", "Team training"],
    format: ["Hybrid", "Live", "Offline"],
  },
  {
    slug: "software",
    name: "Software School",
    headline: "Ship products through Build OS.",
    summary: "Discovery to deployment — learn software the RINADS way: PRD, architecture, AI, and shipping.",
    outcomes: ["Full-stack fundamentals", "Build OS fluency", "Shipped apps"],
    format: ["Online", "Hybrid", "Live"],
  },
  {
    slug: "marketing",
    name: "Marketing School",
    headline: "Grow brands with Marketing OS.",
    summary: "Content, campaigns, SEO, paid media, and analytics — practiced on real growth work.",
    outcomes: ["Campaign skills", "Channel fluency", "Measurement"],
    format: ["Online", "Live"],
  },
  {
    slug: "creator",
    name: "Creator School",
    headline: "Build a creator practice on Creative OS.",
    summary: "Brand, story, content systems, and AI creative tools for modern creators.",
    outcomes: ["Creator OS fluency", "Content systems", "Portfolio"],
    format: ["Online", "Hybrid", "Live"],
  },
];

export function getAcademyProgram(slug: string): AcademyProgram | null {
  return ACADEMY_PROGRAMS.find((p) => p.slug === slug) ?? null;
}
