export const RI_LABS_MODULES = [
  { key: "signals", name: "Signals", outcome: "Turn customer, market and operating signals into testable theses." },
  { key: "knowledge", name: "Knowledge", outcome: "Convert research and evidence into governed capability hypotheses." },
  { key: "product", name: "Product Lab", outcome: "Prototype reusable products, services and Industry Pack capabilities." },
  { key: "automation", name: "Automation Lab", outcome: "Design repeatable workflows with policy, approvals and audit." },
  { key: "agent-eval", name: "Agent Eval", outcome: "Evaluate RINPO behavior, tool use, cost, safety and task success." },
  { key: "tenant-sandbox", name: "Tenant Sandbox", outcome: "Validate tenant isolation, templates, entitlements and first-value flows." },
  { key: "launch-gate", name: "Launch Gate", outcome: "Require evidence, security, unit economics and rollback readiness before release." },
  { key: "scale-kill", name: "Scale / Kill", outcome: "Scale validated bets and stop experiments that fail evidence or economics." },
] as const;

export type RiLabsModuleKey = (typeof RI_LABS_MODULES)[number]["key"];

export type RiLabsStage =
  | "signal"
  | "thesis"
  | "spec"
  | "sandbox"
  | "eval"
  | "pilot"
  | "productize"
  | "launch"
  | "scale"
  | "kill";

const RI_LABS_TRANSITIONS: Record<RiLabsStage, readonly RiLabsStage[]> = {
  signal: ["thesis", "kill"],
  thesis: ["spec", "kill"],
  spec: ["sandbox", "kill"],
  sandbox: ["eval", "kill"],
  eval: ["pilot", "sandbox", "kill"],
  pilot: ["productize", "sandbox", "kill"],
  productize: ["launch", "sandbox", "kill"],
  launch: ["scale", "productize", "kill"],
  scale: ["productize", "kill"],
  kill: [],
};

export function canTransitionRiLabs(from: RiLabsStage, to: RiLabsStage): boolean {
  return RI_LABS_TRANSITIONS[from].includes(to);
}

export type SelfServeActivationState =
  | "discovered"
  | "identity_ready"
  | "tenant_reserved"
  | "payment_pending"
  | "paid"
  | "entitled"
  | "provisioning"
  | "pack_installed"
  | "first_value"
  | "active"
  | "blocked"
  | "failed"
  | "suspended";

const ACTIVATION_TRANSITIONS: Record<SelfServeActivationState, readonly SelfServeActivationState[]> = {
  discovered: ["identity_ready", "failed"],
  identity_ready: ["tenant_reserved", "failed"],
  tenant_reserved: ["payment_pending", "failed"],
  payment_pending: ["paid", "blocked", "failed"],
  paid: ["entitled", "blocked", "failed"],
  entitled: ["provisioning", "blocked", "failed"],
  provisioning: ["pack_installed", "blocked", "failed"],
  pack_installed: ["first_value", "blocked", "failed"],
  first_value: ["active", "blocked", "failed"],
  active: ["suspended"],
  blocked: ["payment_pending", "entitled", "provisioning", "pack_installed", "first_value", "failed"],
  failed: ["identity_ready", "tenant_reserved", "payment_pending", "provisioning"],
  suspended: ["active"],
};

export function canTransitionSelfServe(
  from: SelfServeActivationState,
  to: SelfServeActivationState,
): boolean {
  return ACTIVATION_TRANSITIONS[from].includes(to);
}

export const RUN_BUSINESS_24X7_LOOPS = [
  { key: "sell", name: "SELL", purpose: "Discover demand, capture leads, qualify, quote and collect payment." },
  { key: "deliver", name: "DELIVER", purpose: "Provision software, fulfill services/orders, communicate and resolve exceptions." },
  { key: "run", name: "RUN", purpose: "Operate work, finance, people, approvals, compliance and daily health." },
  { key: "grow", name: "GROW", purpose: "Retain, re-engage, upsell, publish, campaign and improve conversion." },
  { key: "support", name: "SUPPORT", purpose: "Resolve routine requests autonomously and escalate governed exceptions." },
] as const;

export type RunBusinessLoopKey = (typeof RUN_BUSINESS_24X7_LOOPS)[number]["key"];

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export const AUTONOMY_LEVELS: Record<AutonomyLevel, string> = {
  0: "Observe only",
  1: "Recommend",
  2: "Prepare or draft",
  3: "Execute after approval",
  4: "Execute automatically inside explicit policy limits",
};

export type GlobalCatalogItemType =
  | "software_subscription"
  | "industry_pack"
  | "capability_pack"
  | "digital_product"
  | "managed_service"
  | "training"
  | "integration"
  | "usage_credit";

export type GlobalCatalogItem = {
  key: string;
  type: GlobalCatalogItemType;
  name: string;
  capabilities: readonly string[];
  provisioningTemplate?: string;
  requiresTenant: boolean;
  recurring: boolean;
};
