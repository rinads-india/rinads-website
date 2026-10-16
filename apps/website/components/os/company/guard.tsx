import type { ReactNode } from "react";
import { can } from "@rinads/company-os-engine";
import { loadCompanyData, type CompanyData } from "@/lib/company-os/load";
import { CompanyApprovalsInbox } from "@/components/os/company/CompanyApprovalsInbox";
import { CompanyCustomersList } from "@/components/os/company/CompanyCustomersList";
import { CompanyFinanceHub } from "@/components/os/company/CompanyFinanceHub";
import { CompanyOsWorkspaceStub } from "@/components/os/company/CompanyOsWorkspaceStub";
import { CompanyPeopleHub } from "@/components/os/company/CompanyPeopleHub";
import { CompanySalesPipeline } from "@/components/os/company/CompanySalesPipeline";
import { CompanyWorkHub } from "@/components/os/company/CompanyWorkHub";
import { FounderTower } from "@/components/os/company/FounderTower";
import { NoAccess, NotReady } from "./ui";

export type Ready = Extract<CompanyData, { kind: "ready" }>;

/**
 * What a route shows when it cannot run live. Demo-auth mode keeps the labelled demo-store screens
 * that shipped with the Company OS v1 shell (PR #129); nothing here is read from a database.
 */
const DEMO_SCREEN: Record<string, ReactNode> = {
  "/os/founder": <FounderTower />,
  "/os/customers": <CompanyCustomersList />,
  "/os/sales": <CompanySalesPipeline />,
  "/os/work": <CompanyWorkHub />,
  "/os/people": <CompanyPeopleHub />,
  "/os/finance": <CompanyFinanceHub />,
  "/os/approvals": <CompanyApprovalsInbox />,
};

export type GuardFallbacks = {
  /** Shown to Business OS tenants (a real organisation that is not an operator tenant). */
  business?: ReactNode;
  /** Overrides the demo-auth screen. */
  demo?: ReactNode;
};

/**
 * Every Company OS page starts here: live operator organisation required, then a permission check.
 * (The database independently enforces both via RLS — this only produces a clear page.)
 */
export async function guard(path: string, permission: string | null, title: string, fallbacks: GuardFallbacks = {}): Promise<{ ok: false; block: ReactNode } | { ok: true; data: Ready }> {
  const data = await loadCompanyData(path);
  if (data.kind === "demo") {
    const areaPath = "/" + path.split("/").slice(1, 3).join("/");
    return { ok: false, block: fallbacks.demo ?? DEMO_SCREEN[areaPath] ?? <CompanyOsWorkspaceStub title={title} /> };
  }
  if (data.kind === "business") return { ok: false, block: fallbacks.business ?? <NotReady kind="business" /> };
  if (data.kind !== "ready") return { ok: false, block: <NotReady kind={data.kind} /> };
  if (permission && !can(data.session.ctx, permission)) return { ok: false, block: <NoAccess title={title} permission={permission} /> };
  return { ok: true, data };
}
