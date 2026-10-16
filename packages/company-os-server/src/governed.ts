import { DEFAULT_ACTION_POLICY, type GovernedDeps, type TenantActionPolicy } from "@rinads/company-os";
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
