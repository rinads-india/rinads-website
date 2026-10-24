export const DEFAULT_PLANS = [
  { key: "starter", name: "Starter", limits: { modules: ["commerce", "inventory"], seats: 5 } },
  { key: "trial-starter", name: "Trial Starter", limits: { modules: ["commerce", "inventory", "crm", "tasks"], seats: 3 } },
  { key: "growth", name: "Growth", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment"], seats: 25 } },
  { key: "platform", name: "Platform", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment", "crm", "tasks"], seats: 100 } },
] as const;

export function planIncludesModule(planLimits: Record<string, unknown>, module: string): boolean {
  const modules = planLimits.modules;
  // Missing or empty entitlement manifests must fail closed. A malformed plan
  // should never become an implicit all-access plan.
  if (!Array.isArray(modules) || modules.length === 0) return false;
  return modules.includes(module);
}
