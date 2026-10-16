import { isAvailable, type CompanyFacts } from "@rinads/company-os-engine";

export type Option = { value: string; label: string };

export const companyOptions = (f: CompanyFacts): Option[] => (isAvailable(f.companies) ? f.companies.data.map((c) => ({ value: c.id, label: c.name })) : []);
export const projectOptions = (f: CompanyFacts): Option[] => (isAvailable(f.projects) ? f.projects.data.map((p) => ({ value: p.id, label: p.name })) : []);
export const opportunityOptions = (f: CompanyFacts): Option[] =>
  isAvailable(f.opportunities) ? f.opportunities.data.filter((o) => o.stage !== "won" && o.stage !== "lost").map((o) => ({ value: o.id, label: `${o.title}${o.companyName ? ` — ${o.companyName}` : ""}` })) : [];
export const personOptions = (f: CompanyFacts): Option[] =>
  isAvailable(f.people) ? f.people.data.filter((p) => !p.userId.startsWith("profile:") && p.status === "active").map((p) => ({ value: p.userId, label: `${p.name}${p.roleTitle ? ` (${p.roleTitle})` : ""}` })) : [];
