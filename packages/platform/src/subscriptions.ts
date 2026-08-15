export const DEFAULT_PLANS = [
  { key: "starter", name: "Starter", limits: { modules: ["commerce", "inventory"], seats: 5 } },
  { key: "growth", name: "Growth", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment"], seats: 25 } },
  { key: "platform", name: "Platform", limits: { modules: ["commerce", "inventory", "procurement", "fulfilment", "crm", "tasks"], seats: 100 } },
] as const;

export function planIncludesModule(planLimits: Record<string, unknown>, module: string): boolean {
  const modules = planLimits.modules;
  if (!Array.isArray(modules)) return true;
  return modules.includes(module);
}
