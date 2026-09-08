export type ContentModule = {
  name: string;
  description?: string;
};

export type OsPageContent = {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  summary: string;
  modules: ContentModule[];
  related?: { label: string; href: string }[];
};

export type VerticalContent = {
  slug: string;
  name: string;
  type: string;
  headline: string;
  summary: string;
  capabilities: string[];
  status: "available" | "coming";
};

export type AcademyProgram = {
  slug: string;
  name: string;
  headline: string;
  summary: string;
  outcomes: string[];
  format: Array<"Online" | "Offline" | "Hybrid" | "Live">;
};

export type ServiceLine = {
  slug: string;
  name: string;
  verb: string;
  headline: string;
  summary: string;
  offerings: string[];
};
