import { DEFAULT_ACTION_POLICY, type GovernedDeps, type TenantActionPolicy } from "@rinads/company-os-engine";
import type { RowDb } from "./db";
import type { SiteLeadSource } from "./kit";
import { createAuditPort, createEventPort, createLedgerPort } from "./ports";
import { createDomainTools } from "./tools";

export type GovernedOptions = {
  policy?: TenantActionPolicy;
  now?: () => Date;
  siteLeads?: SiteLeadSource;
};

/**
 * Composition root for the governed-action pipeline over a caller-scoped RowDb.
 * `db` MUST be the signed-in user's RLS-bound session; there is intentionally no service-role path.
 */
export function createGovernedDeps(db: RowDb, options: GovernedOptions = {}): GovernedDeps {
  const now = options.now ?? (() => new Date());
  return {
    ledger: createLedgerPort(db),
    audit: createAuditPort(db),
    events: createEventPort(db),
    tools: createDomainTools({ db, now, siteLeads: options.siteLeads }),
    policy: options.policy ?? DEFAULT_ACTION_POLICY,
    now,
  };
}

const POLICY_KEY = "company_os.actions";

/**
 * Tenant approval policy from the existing `tenant_policies` table (latest active version).
 * Anything missing, malformed or unreadable falls back to the safe defaults — a policy can only
 * be as strict as the defaults or stricter in intent; invalid numbers are ignored, never trusted.
 */
export async function loadActionPolicy(db: RowDb, organizationId: string): Promise<TenantActionPolicy> {
  try {
    const { data, error } = await db.select("tenant_policies", { where: { organization_id: organizationId, policy_key: POLICY_KEY, is_active: true }, order: [{ column: "version", ascending: false }], limit: 1 });
    if (error || !data[0]) return DEFAULT_ACTION_POLICY;
    const v = (data[0].policy_value ?? {}) as Record<string, unknown>;
    const budget = (v.budget ?? {}) as Record<string, unknown>;
    const pos = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : null);
    return {
      requireDistinctApprover: typeof v.requireDistinctApprover === "boolean" ? v.requireDistinctApprover : DEFAULT_ACTION_POLICY.requireDistinctApprover,
      criticalPaymentAmount: pos(v.criticalPaymentAmount),
      approvalTtlHours: Math.min(pos(v.approvalTtlHours) ?? DEFAULT_ACTION_POLICY.approvalTtlHours, 24 * 14),
      budget: {
        maxAutoChangePct: Math.min(pos(budget.maxAutoChangePct) ?? DEFAULT_ACTION_POLICY.budget.maxAutoChangePct, 100),
        highBudgetThreshold: pos(budget.highBudgetThreshold),
      },
    };
  } catch {
    return DEFAULT_ACTION_POLICY;
  }
}
