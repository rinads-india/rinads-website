import { isAvailable, type CompanyFacts } from "@rinads/company-os-engine";

/** userId → display name, from people profiles the caller may read. Unknown ids stay unnamed (never guessed). */
export function memberNames(facts: CompanyFacts): Map<string, string> {
  const map = new Map<string, string>();
  if (isAvailable(facts.people)) for (const p of facts.people.data) map.set(p.userId, p.name);
  return map;
}

export const nameOf = (names: ReadonlyMap<string, string>, id: string | null | undefined): string => (id ? (names.get(id) ?? `Member ${id.slice(0, 6)}`) : "Unassigned");
